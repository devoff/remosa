import { FlowData, NodeData } from '../types';
import { getNodeColor } from '../components/NodeTypes';

// Функция для преобразования данных потока Node-RED в формат ReactFlow
export function parseNodeRedFlow(flow: FlowData, activeNodeIds: string[] = []) {
  const nodes = flow.nodes.map(node => {
    // Определяем, активен ли узел
    const isActive = activeNodeIds.includes(node.id);
    const nodeColor = getNodeColor(node.type);
    
    return {
      id: node.id,
      type: 'customNode',
      position: { x: node.x || 0, y: node.y || 0 },
      data: {
        ...node,
        label: node.label || node.type,
        type: node.type,
        active: isActive,
        inputs: node.inputs || 1,
        outputs: node.outputs || 1
      },
      // Применяем стили для активных узлов
      style: {
        boxShadow: isActive ? `0 0 10px ${nodeColor}` : 'none',
        transition: 'box-shadow 0.3s ease'
      }
    };
  });
  
  // Создаем ребра (связи между узлами)
  const edges = [];
  
  flow.nodes.forEach(node => {
    if (node.wires && Array.isArray(node.wires)) {
      // Обрабатываем каждый выходной порт
      node.wires.forEach((outputs, outputIndex) => {
        if (Array.isArray(outputs)) {
          // Обрабатываем каждый выход порта
          outputs.forEach(targetId => {
            // Находим целевой узел
            const targetNode = flow.nodes.find(n => n.id === targetId);
            if (targetNode) {
              // Создаем уникальный идентификатор для ребра
              const edgeId = `${node.id}-${outputIndex}-${targetId}`;
              
              // Определяем, является ли ребро активным (если оба узла активны)
              const isActive = activeNodeIds.includes(node.id) && 
                              activeNodeIds.includes(targetId);
              
              edges.push({
                id: edgeId,
                source: node.id,
                target: targetId,
                sourceHandle: `output-${outputIndex}`,
                targetHandle: 'input-0', // Для упрощения считаем, что входной порт всегда первый
                // Стили для активных ребер
                animated: isActive,
                style: {
                  stroke: isActive ? getNodeColor(node.type) : '#888',
                  strokeWidth: isActive ? 3 : 2,
                  transition: 'stroke 0.3s ease, stroke-width 0.3s ease'
                }
              });
            }
          });
        }
      });
    }
  });
  
  return { nodes, edges };
}