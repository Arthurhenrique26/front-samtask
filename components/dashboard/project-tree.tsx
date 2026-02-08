'use client'

import { useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  MarkerType,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Category } from '@/lib/types';

// Estilo customizado para o nó (Glassmorphism)
const CustomNode = ({ data }: any) => {
  return (
    <div className={`px-4 py-3 rounded-xl border border-white/10 backdrop-blur-md shadow-2xl min-w-[150px] text-center transition-all hover:scale-105 hover:shadow-neon-${data.colorName || 'violet'}`}
         style={{ backgroundColor: `${data.color}10`, borderColor: data.color }}>
      <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70" style={{ color: data.color }}>
        {data.type}
      </div>
      <div className="font-bold text-white text-sm">
        {data.label}
      </div>
      {data.progress !== undefined && (
        <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
          <div className="h-full transition-all duration-500" 
               style={{ width: `${data.progress}%`, backgroundColor: data.color }} />
        </div>
      )}
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

interface ProjectTreeProps {
  categories: Category[]
}

export default function ProjectTree({ categories }: ProjectTreeProps) {
  // Transformar categorias em "Nós" do gráfico
  const initialNodes: Node[] = useMemo(() => {
    return categories.map((cat, index) => ({
      id: cat.id,
      type: 'custom',
      position: { x: 250 * (index % 3), y: 150 * Math.floor(index / 3) }, // Grid simples
      data: { 
        label: cat.name, 
        color: cat.color, 
        type: 'Matéria',
        progress: Math.floor(Math.random() * 100) // Mock de progresso (depois ligamos no real)
      },
    }));
  }, [categories]);

  // Criar conexões (Edges) fictícias para demonstração 
  // (Num app real, você teria uma tabela 'dependencies')
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    if (categories.length > 1) {
      // Conecta o primeiro ao segundo só para mostrar a linha
      edges.push({
        id: 'e1-2',
        source: categories[0]?.id,
        target: categories[1]?.id,
        animated: true,
        style: { stroke: '#6366f1' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      });
    }
    return edges;
  }, [categories]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="h-[calc(100vh-10rem)] w-full border border-white/5 rounded-xl overflow-hidden bg-slate-950 shadow-2xl relative group">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-950"
      >
        <Background color="#334155" gap={20} size={1} />
        <Controls className="bg-slate-900 border-slate-800 fill-white" />
        <MiniMap 
          nodeColor={(n) => n.data.color} 
          className="bg-slate-900 border border-slate-800 rounded-lg"
          maskColor="rgba(0, 0, 0, 0.7)"
        />
      </ReactFlow>
      
      <div className="absolute top-4 left-4 pointer-events-none">
         <h3 className="text-white font-bold text-lg drop-shadow-lg">Mapa de Conhecimento</h3>
         <p className="text-slate-400 text-xs">Visualize as dependências entre matérias.</p>
      </div>
    </div>
  );
}