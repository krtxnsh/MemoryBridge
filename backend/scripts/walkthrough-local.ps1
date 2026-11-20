$ErrorActionPreference = "Stop"

# Use local storage provider
$env:PORT = "4000"
$env:NODE_ENV = "development"
$env:STORAGE_PROVIDER = "local"
$env:LOCAL_STORAGE_DIR = "uploads"
$env:STORAGE_HMAC_SECRET = "super-secret-hmac-key-for-local-storage-testing-0123456789"
$env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/memorybridge?schema=public"
$env:JWT_ACCESS_SECRET = "test-jwt-access-secret-at-least-32-chars-long!"
$env:JWT_REFRESH_SECRET = "test-jwt-refresh-secret-at-least-32-chars-long!"
$env:PATIENT_SESSION_SECRET = "test-patient-session-secret-at-least-32-chars!"

Write-Host "--- 1. Starting Backend Server on port 4000 ---"
$serverProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx tsx src/server.ts" -WorkingDirectory "backend" -PassThru -NoNewWindow
Start-Sleep -Seconds 4

try {
  $baseUrl = "http://localhost:4000"
  
  # 1. Register & Login
  Write-Host "`n--- 2. Register & Login ---"
  $uniqueEmail = "walkthrough_$(Get-Random)@example.com"
  @{
    email = $uniqueEmail
    password = "SuperSecretPass2026!"
    name = "Walkthrough Admin"
    role = "CAREGIVER"
  } | ConvertTo-Json | Set-Content -Path "backend/uploads/reg.json" -Encoding utf8

  $regRes = curl.exe -s -X POST "$baseUrl/api/v1/auth/register" -H "Content-Type: application/json" -d "@backend/uploads/reg.json"
  Write-Host "Register Response: $regRes"
  $token = ($regRes | ConvertFrom-Json).data.accessToken
  if (-not $token) { throw "Failed to obtain access token" }

  # 2. Create Patient
  Write-Host "`n--- 3. Create Patient ---"
  @{
    fullName = "Eleanor Walkthrough"
    dateOfBirth = "1940-05-12"
  } | ConvertTo-Json | Set-Content -Path "backend/uploads/pat.json" -Encoding utf8

  $patRes = curl.exe -s -X POST "$baseUrl/api/v1/patients" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "@backend/uploads/pat.json"
  Write-Host "Patient Response: $patRes"
  $patientId = ($patRes | ConvertFrom-Json).data.id

  # Prepare real JPEG sample (16 bytes header)
  $jpegBytes = [byte[]](0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60)
  $jpegPath = "backend/uploads/sample.jpg"
  if (-not (Test-Path "backend/uploads")) { New-Item -ItemType Directory -Path "backend/uploads" | Out-Null }
  [System.IO.File]::WriteAllBytes($jpegPath, $jpegBytes)

  # 3. Request Upload URL
  Write-Host "`n--- 4. Request Upload URL (Valid JPEG) ---"
  @{
    fileName = "photo.jpg"
    mimeType = "image/jpeg"
    sizeBytes = $jpegBytes.Length
    purpose = "MEMORY_MEDIA"
  } | ConvertTo-Json | Set-Content -Path "backend/uploads/upload_url.json" -Encoding utf8

  $uploadUrlRes = curl.exe -s -X POST "$baseUrl/api/v1/patients/$patientId/media/upload-url" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "@backend/uploads/upload_url.json"
  Write-Host "Upload URL Response: $uploadUrlRes"
  $uploadData = ($uploadUrlRes | ConvertFrom-Json).data
  $uploadId = $uploadData.uploadId
  $uploadUrl = $uploadData.uploadUrl
  Write-Host "Upload Target: $uploadUrl"

  # 4. PUT file to local storage endpoint
  Write-Host "`n--- 5. PUT File to Local Storage ---"
  $fullUploadUrl = if ($uploadUrl.StartsWith("http")) { $uploadUrl } else { "$baseUrl$uploadUrl" }
  $putRes = curl.exe -s -w "%{http_code}" -X PUT "$fullUploadUrl" -H "Content-Type: image/jpeg" --data-binary "@$jpegPath"
  Write-Host "PUT HTTP Code: $putRes"

  # 5. Confirm Upload
  Write-Host "`n--- 6. Confirm Upload ---"
  @{
    uploadId = $uploadId
    caption = "Memory photo in garden"
  } | ConvertTo-Json | Set-Content -Path "backend/uploads/confirm.json" -Encoding utf8

  $confirmRes = curl.exe -s -X POST "$baseUrl/api/v1/patients/$patientId/media/confirm" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "@backend/uploads/confirm.json"
  Write-Host "Confirm Response: $confirmRes"
  $mediaId = ($confirmRes | ConvertFrom-Json).data.id

  # 6. List Media
  Write-Host "`n--- 7. List Media ---"
  $listRes = curl.exe -s -X GET "$baseUrl/api/v1/patients/$patientId/media" -H "Authorization: Bearer $token"
  Write-Host "List Response: $listRes"

  # 7. GET /media/:id/url and fetch that URL
  Write-Host "`n--- 8. GET /media/:id/url and Fetch Bytes ---"
  $getUrlRes = curl.exe -s -X GET "$baseUrl/api/v1/media/$mediaId/url" -H "Authorization: Bearer $token"
  Write-Host "Read URL Response: $getUrlRes"
  $readUrl = ($getUrlRes | ConvertFrom-Json).data.url
  $fullReadUrl = if ($readUrl.StartsWith("http")) { $readUrl } else { "$baseUrl$readUrl" }
  Write-Host "Fetching Read URL: $fullReadUrl"

  $fetchFile = "backend/uploads/fetched_sample.jpg"
  $fetchCode = curl.exe -s -w "%{http_code}" -o "$fetchFile" "$fullReadUrl"
  Write-Host "Fetch HTTP Code: $fetchCode"
  $fetchedLength = (Get-Item "$fetchFile").Length
  Write-Host "Fetched bytes length: $fetchedLength (expected: $($jpegBytes.Length))"

  # 8. Delete Media
  Write-Host "`n--- 9. Delete Media (Soft Delete & Storage Purge) ---"
  $delRes = curl.exe -s -X DELETE "$baseUrl/api/v1/media/$mediaId" -H "Authorization: Bearer $token"
  Write-Host "Delete Response: $delRes"

  # Fetch again must fail
  Write-Host "`n--- 10. Fetching Deleted Media URL (Must Fail 404) ---"
  $fetchFailCode = curl.exe -s -w "%{http_code}" -o NUL "$fullReadUrl"
  Write-Host "Deleted File Fetch HTTP Code: $fetchFailCode (Expect 404)"

  # 9. PNG renamed to .jpg: Upload and Confirm must reject & delete
  Write-Host "`n--- 11. Upload PNG renamed to .jpg (Magic Bytes Mismatch) ---"
  $pngBytes = [byte[]](0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d)
  $fakeJpgPath = "backend/uploads/fake.jpg"
  [System.IO.File]::WriteAllBytes($fakeJpgPath, $pngBytes)

  @{
    fileName = "fake.jpg"
    mimeType = "image/jpeg"
    sizeBytes = $pngBytes.Length
    purpose = "MEMORY_MEDIA"
  } | ConvertTo-Json | Set-Content -Path "backend/uploads/fake_url.json" -Encoding utf8

  $fakeUrlRes = curl.exe -s -X POST "$baseUrl/api/v1/patients/$patientId/media/upload-url" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "@backend/uploads/fake_url.json"
  $fakeUploadData = ($fakeUrlRes | ConvertFrom-Json).data
  $fakeUploadId = $fakeUploadData.uploadId
  $fakeUploadUrl = $fakeUploadData.uploadUrl
  $fullFakeUploadUrl = if ($fakeUploadUrl.StartsWith("http")) { $fakeUploadUrl } else { "$baseUrl$fakeUploadUrl" }

  # PUT PNG bytes
  $fakePutCode = curl.exe -s -w "%{http_code}" -X PUT "$fullFakeUploadUrl" -H "Content-Type: image/jpeg" --data-binary "@$fakeJpgPath"
  Write-Host "Fake PUT HTTP Code: $fakePutCode"

  # Confirm must fail with INVALID_FILE_SIGNATURE
  @{ uploadId = $fakeUploadId } | ConvertTo-Json | Set-Content -Path "backend/uploads/fake_confirm.json" -Encoding utf8
  $fakeConfirmRes = curl.exe -s -X POST "$baseUrl/api/v1/patients/$patientId/media/confirm" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "@backend/uploads/fake_confirm.json"
  Write-Host "Fake Confirm Response: $fakeConfirmRes"

  Write-Host "`n=== LIVE WALKTHROUGH COMPLETED SUCCESSFULLY ==="
}
finally {
  if ($serverProcess -and -not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force
  }
}
