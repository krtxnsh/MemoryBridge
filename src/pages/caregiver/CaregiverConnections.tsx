import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { Share2, BookOpen, User, Sparkles, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  category: 'patient' | 'family' | 'event' | 'place';
  x: number;
  y: number;
  color: string;
  memoryId?: string;
  details: string;
}

interface GraphLink {
  source: string;
  target: string;
  label: string;
}

export const CaregiverConnections: React.FC = () => {
  const navigate = useNavigate();
  const { patientName } = useApp();

  const [zoom, setZoom] = useState<number>(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-rajiv');

  const nodes: GraphNode[] = [
    { id: 'node-rajiv', label: 'Rajiv (Self)', category: 'patient', x: 350, y: 250, color: '#F36B32', details: 'Central patient profile. Born 1957 in Shimla.' },
    { id: 'node-anita', label: 'Anita (Wife)', category: 'family', x: 200, y: 150, color: '#E91E63', details: 'Married in 1985. Shares memories of Rose Garden wedding, Goa sunset, and morning tea.' },
    { id: 'node-riya', label: 'Riya (Daughter)', category: 'family', x: 500, y: 160, color: '#4CAF50', details: 'Architect daughter. Shares memories of Goa sandcastles and Diwali oil lamps.' },
    { id: 'node-suresh', label: 'Suresh (Friend)', category: 'family', x: 170, y: 350, color: '#00BCD4', details: 'St. Stephens college classmate, batch of 1978. Shared engineering projects.' },
    { id: 'node-daniel', label: 'Daniel (Grandson)', category: 'family', x: 530, y: 350, color: '#FF9800', details: 'Grandson born 2018. Shares memories of tulip park walks and leaf whistling.' },
    { id: 'node-wedding', label: 'Wedding 1985', category: 'event', x: 230, y: 50, color: '#F4511E', memoryId: 'mem-1985', details: 'November 22, 1985. Orange marigolds and red silk saree.' },
    { id: 'node-goa', label: 'Goa Trip 1998', category: 'event', x: 350, y: 90, color: '#03A9F4', memoryId: 'mem-1998', details: 'Calangute beach picnic with Anita and little Riya.' },
    { id: 'node-college', label: 'St. Stephens 1978', category: 'place', x: 90, y: 250, color: '#3F51B5', memoryId: 'mem-1978', details: 'Civil engineering graduation with honors.' },
    { id: 'node-abc', label: 'ABC Company 1988', category: 'place', x: 350, y: 410, color: '#795548', memoryId: 'mem-1988', details: 'Led bridge engineering foundation across Yamuna.' }
  ];

  const links: GraphLink[] = [
    { source: 'node-rajiv', target: 'node-anita', label: 'Married 1985' },
    { source: 'node-rajiv', target: 'node-riya', label: 'Father & Daughter' },
    { source: 'node-rajiv', target: 'node-suresh', label: 'College Best Friends' },
    { source: 'node-rajiv', target: 'node-daniel', label: 'Grandfather' },
    { source: 'node-rajiv', target: 'node-wedding', label: 'Sacred Vows' },
    { source: 'node-anita', target: 'node-wedding', label: 'Bride' },
    { source: 'node-rajiv', target: 'node-goa', label: 'Family Vacation' },
    { source: 'node-riya', target: 'node-goa', label: 'First Beach Visit' },
    { source: 'node-anita', target: 'node-goa', label: 'Sunset Strolls' },
    { source: 'node-rajiv', target: 'node-college', label: 'Graduated' },
    { source: 'node-suresh', target: 'node-college', label: 'Study Partner' },
    { source: 'node-rajiv', target: 'node-abc', label: 'Bridge Engineer' },
    { source: 'node-riya', target: 'node-daniel', label: 'Mother' },
  ];

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  const connectedLinkIds = links.filter(
    l => l.source === selectedNodeId || l.target === selectedNodeId
  );

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary">
            Memory Connection Graph
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Visual network of relationships, life events, places, and shared family ties.
          </p>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-surface-border shadow-sm">
          <button
            onClick={() => setZoom(z => Math.max(0.7, z - 0.1))}
            className="p-2 rounded-xl hover:bg-warm-cream text-ink-secondary"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-ink-primary px-2">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(1.4, z + 0.1))}
            className="p-2 rounded-xl hover:bg-warm-cream text-ink-secondary"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 rounded-xl hover:bg-warm-cream text-ink-secondary"
            title="Reset zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive SVG Node Canvas (Col 8) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-surface-border shadow-soft p-4 relative overflow-hidden min-h-[500px]">
          <div className="absolute top-4 left-4 z-10 bg-warm-cream/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-warm-sand text-xs font-semibold text-ink-primary">
            Click any node to reveal memory bonds
          </div>

          <svg
            viewBox="0 0 700 500"
            className="w-full h-auto select-none"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}
          >
            {/* Background Soft Mesh */}
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#F8F1E8" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="700" height="500" fill="url(#grid)" />

            {/* Connecting Edges */}
            {links.map((link, idx) => {
              const srcNode = nodes.find(n => n.id === link.source)!;
              const tgtNode = nodes.find(n => n.id === link.target)!;
              const isHighlighted = link.source === selectedNodeId || link.target === selectedNodeId;

              return (
                <g key={idx}>
                  <line
                    x1={srcNode.x}
                    y1={srcNode.y}
                    x2={tgtNode.x}
                    y2={tgtNode.y}
                    stroke={isHighlighted ? '#F36B32' : '#E0D6CB'}
                    strokeWidth={isHighlighted ? 3 : 1.5}
                    strokeDasharray={isHighlighted ? 'none' : '4 4'}
                    className="transition-all duration-300"
                  />
                  {isHighlighted && (
                    <text
                      x={(srcNode.x + tgtNode.x) / 2}
                      y={(srcNode.y + tgtNode.y) / 2 - 6}
                      fill="#B8431A"
                      fontSize="9"
                      fontFamily="'Inter', sans-serif"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="bg-white"
                    >
                      {link.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isCenter = node.id === 'node-rajiv';

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer transition-transform duration-200"
                  tabIndex={0}
                  role="button"
                  aria-label={node.label}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedNodeId(node.id);
                  }}
                >
                  {/* Selection Ring */}
                  {isSelected && (
                    <circle cx="0" cy="0" r={isCenter ? 44 : 36} fill="#F36B32" opacity="0.2" className="animate-ping" />
                  )}

                  {/* Main Circle */}
                  <circle
                    cx="0"
                    cy="0"
                    r={isCenter ? 36 : 28}
                    fill={isSelected ? '#F36B32' : '#FFFDF9'}
                    stroke={isSelected ? '#D95424' : node.color}
                    strokeWidth={isSelected ? 4 : 2.5}
                    className="shadow-md transition-colors"
                  />

                  {/* Inner Node Icon/Text */}
                  <text
                    x="0"
                    y="4"
                    fill={isSelected ? '#FFFFFF' : '#292521'}
                    fontSize={isCenter ? '12' : '10'}
                    fontWeight="bold"
                    fontFamily="'Inter', sans-serif"
                    textAnchor="middle"
                  >
                    {node.label.split(' ')[0]}
                  </text>

                  {/* Node Label Below */}
                  <rect
                    x="-50"
                    y={isCenter ? 42 : 32}
                    width="100"
                    height="18"
                    rx="6"
                    fill="#FFFFFF"
                    stroke="#E9E3DC"
                    strokeWidth="1"
                    opacity="0.9"
                  />
                  <text
                    x="0"
                    y={isCenter ? 54 : 44}
                    fill="#292521"
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="'Inter', sans-serif"
                    textAnchor="middle"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Details Card (Col 4) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-surface-border p-6 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-warm-peach text-primary-text">
                {selectedNode.category.toUpperCase()} NODE
              </span>
              <span className="text-xs text-ink-secondary">
                {connectedLinkIds.length} Connections
              </span>
            </div>

            <h3 className="font-serif text-2xl font-bold text-ink-primary">
              {selectedNode.label}
            </h3>

            <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
              {selectedNode.details}
            </p>

            {/* Connection list */}
            <div className="mt-4 pt-4 border-t border-surface-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-secondary mb-2">
                Connected Bonds:
              </h4>
              <ul className="space-y-1.5">
                {connectedLinkIds.map((l, i) => {
                  const otherNodeId = l.source === selectedNode.id ? l.target : l.source;
                  const otherNode = nodes.find(n => n.id === otherNodeId)!;
                  return (
                    <li
                      key={i}
                      onClick={() => setSelectedNodeId(otherNode.id)}
                      className="text-xs font-medium text-ink-primary hover:text-primary cursor-pointer p-1.5 rounded-lg hover:bg-warm-cream flex items-center justify-between border border-transparent hover:border-warm-sand"
                    >
                      <span>{otherNode.label}</span>
                      <span className="text-[10px] text-ink-secondary italic">{l.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {selectedNode.memoryId && (
            <div className="mt-6 pt-4 border-t border-surface-border">
              <button
                onClick={() => navigate(`/family/memory/${selectedNode.memoryId}`)}
                className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-xs shadow-soft hover:bg-primary-hover transition-colors flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" />
                <span>Open Memory Detail</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
