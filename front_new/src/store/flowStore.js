import { create } from 'zustand';
import { nanoid } from 'nanoid';
// Начальное состояние симуляции
const initialSimulationState = {
    running: false,
    events: [],
    activeNodes: []
};
// Создаем хранилище для управления потоками и симуляцией
export const useFlowStore = create((set, get) => ({
    // Состояние потоков
    flows: [
        {
            id: 'c514659d7785b664',
            label: 'Поток мониторинга',
            nodes: [],
            disabled: false,
            info: 'Основной поток для мониторинга устройств',
            env: []
        }
    ],
    currentFlow: 'c514659d7785b664',
    selectedNode: null,
    clipboard: null,
    simulation: initialSimulationState,
    isEditingConfig: false,
    // Действия для управления узлами
    addNode: (node) => {
        set(state => {
            const flows = [...state.flows];
            const flowIndex = flows.findIndex(f => f.id === state.currentFlow);
            if (flowIndex >= 0) {
                flows[flowIndex].nodes.push(node);
            }
            return { flows };
        });
    },
    updateNode: (nodeId, data) => {
        set(state => {
            const flows = [...state.flows];
            const flowIndex = flows.findIndex(f => f.id === state.currentFlow);
            if (flowIndex >= 0) {
                const nodeIndex = flows[flowIndex].nodes.findIndex(n => n.id === nodeId);
                if (nodeIndex >= 0) {
                    flows[flowIndex].nodes[nodeIndex] = {
                        ...flows[flowIndex].nodes[nodeIndex],
                        ...data
                    };
                }
            }
            return { flows };
        });
    },
    removeNode: (nodeId) => {
        set(state => {
            const flows = [...state.flows];
            const flowIndex = flows.findIndex(f => f.id === state.currentFlow);
            if (flowIndex >= 0) {
                flows[flowIndex].nodes = flows[flowIndex].nodes.filter(n => n.id !== nodeId);
            }
            return { flows };
        });
    },
    selectNode: (nodeId) => {
        set({ selectedNode: nodeId });
    },
    copyNode: (nodeId) => {
        const { flows, currentFlow } = get();
        const flow = flows.find(f => f.id === currentFlow);
        if (flow) {
            const node = flow.nodes.find(n => n.id === nodeId);
            if (node) {
                set({ clipboard: { ...node } });
            }
        }
    },
    pasteNode: () => {
        const { clipboard, currentFlow, flows } = get();
        if (clipboard && currentFlow) {
            const newNode = {
                ...clipboard,
                id: nanoid(8),
                x: clipboard.x + 50,
                y: clipboard.y + 50
            };
            get().addNode(newNode);
        }
    },
    // Импорт/экспорт потоков
    importFlow: (flow) => {
        set(state => {
            const flows = [...state.flows];
            const existingFlowIndex = flows.findIndex(f => f.id === flow.id);
            if (existingFlowIndex >= 0) {
                flows[existingFlowIndex] = flow;
            }
            else {
                flows.push(flow);
            }
            return { flows, currentFlow: flow.id };
        });
    },
    exportFlow: () => {
        const { flows, currentFlow } = get();
        return flows.find(f => f.id === currentFlow) || flows[0];
    },
    // Управление симуляцией
    startSimulation: () => {
        set({ simulation: { ...initialSimulationState, running: true } });
    },
    stopSimulation: () => {
        set(state => ({
            simulation: {
                ...state.simulation,
                running: false,
                activeNodes: []
            }
        }));
    },
    addSimulationEvent: (event) => {
        set(state => {
            const events = [event, ...state.simulation.events].slice(0, 100); // Ограничиваем 100 последними событиями
            const activeNodes = [...state.simulation.activeNodes];
            if (!activeNodes.includes(event.nodeId)) {
                activeNodes.push(event.nodeId);
                // Убираем узел из активных через 2 секунды
                setTimeout(() => {
                    set(innerState => ({
                        simulation: {
                            ...innerState.simulation,
                            activeNodes: innerState.simulation.activeNodes.filter(id => id !== event.nodeId)
                        }
                    }));
                }, 2000);
            }
            return {
                simulation: {
                    ...state.simulation,
                    events,
                    activeNodes
                }
            };
        });
    },
    setEditingConfig: (editing) => {
        set({ isEditingConfig: editing });
    }
}));
