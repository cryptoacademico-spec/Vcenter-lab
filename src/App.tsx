import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, Activity, Zap, Database, CheckCircle, Info, FileText, 
  Monitor, Globe, Layers, ChevronRight, Box, MoreVertical, 
  AlertTriangle, ArrowRightLeft, Scale, Play, Power, X, Search, Bell, HelpCircle, User, Settings, Network 
} from 'lucide-react';

// --- TIPOS ---
type ViewMode = 'VCENTER' | 'INFRASTRUCTURE';
type SimulationType = 'NONE' | 'VMOTION' | 'HA' | 'DRS';
type SelectionType = 'DATACENTER' | 'CLUSTER' | 'HOST' | 'VM';
type TabType = 'SUMMARY' | 'MONITOR' | 'CONFIGURE' | 'VMS' | 'HOSTS';

interface VM {
  id: string;
  name: string;
  hostId: string;
  os: string;
  ip: string;
  state: 'poweredOn' | 'poweredOff' | 'suspending' | 'booting';
  toolsStatus: 'Running' | 'NotRunning';
  baseLoad: number; // Carga base de la VM
  isStressed: boolean; // Si está sufriendo un pico de carga
}

interface Host {
  id: string;
  name: string;
  ip: string;
  // CPU y MEM se calculan dinámicamente
  status: 'connected' | 'disconnected' | 'maintenance' | 'failed';
}

const RiveritatechLab = () => {
  // --- ESTADO GLOBAL ---
  const [view, setView] = useState<ViewMode>('VCENTER');
  const [simulation, setSimulation] = useState<SimulationType>('NONE');
  const [logs, setLogs] = useState<string[]>([]);
  
  const [selectedId, setSelectedId] = useState<string>('cluster1');
  const [selectedType, setSelectedType] = useState<SelectionType>('CLUSTER');
  const [activeTab, setActiveTab] = useState<TabType>('SUMMARY');

  // Hosts (Estado base)
  const [hosts, setHosts] = useState<Host[]>([
    { id: 'h1', name: 'esxi01.riveritatech.local', ip: '192.168.10.5', status: 'connected' },
    { id: 'h2', name: 'esxi02.riveritatech.local', ip: '192.168.10.6', status: 'connected' },
    { id: 'h3', name: 'esxi03.riveritatech.local', ip: '192.168.10.7', status: 'connected' },
    { id: 'h4', name: 'esxi04.riveritatech.local', ip: '192.168.10.8', status: 'connected' }, 
  ]);

  // VMs (Distribución inicial)
  const [vms, setVms] = useState<VM[]>([
    // Host 1
    { id: 'vm1', name: 'SRV-DC01', hostId: 'h1', os: 'Windows Server 2025', ip: '192.168.10.10', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 12, isStressed: false },
    { id: 'vm2', name: 'SRV-SQL01', hostId: 'h1', os: 'Windows Server 2022', ip: '192.168.10.11', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 25, isStressed: false }, 
    { id: 'vm3', name: 'FILE-01', hostId: 'h1', os: 'Windows Server 2019', ip: '192.168.10.12', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 8, isStressed: false },
    { id: 'vm4', name: 'PRINT-01', hostId: 'h1', os: 'Windows Server 2019', ip: '192.168.10.13', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 5, isStressed: false },
    { id: 'vm5', name: 'WEB-INT', hostId: 'h1', os: 'Ubuntu 22.04', ip: '192.168.10.14', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 10, isStressed: false },
    
    // Host 2
    { id: 'vm7', name: 'APP-CRM', hostId: 'h2', os: 'Red Hat 9', ip: '192.168.10.20', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 20, isStressed: false }, 
    { id: 'vm8', name: 'APP-ERP', hostId: 'h2', os: 'Red Hat 9', ip: '192.168.10.21', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 22, isStressed: false }, 
    { id: 'vm9', name: 'DEV-01', hostId: 'h2', os: 'Windows 11', ip: '192.168.10.22', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 8, isStressed: false },
    { id: 'vm10', name: 'DEV-02', hostId: 'h2', os: 'Windows 11', ip: '192.168.10.23', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 8, isStressed: false },
    { id: 'vm11', name: 'TEST-DB', hostId: 'h2', os: 'Oracle Linux', ip: '192.168.10.24', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 15, isStressed: false },

    // Host 3
    { id: 'vm12', name: 'VDI-01', hostId: 'h3', os: 'Windows 11', ip: '192.168.10.50', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 6, isStressed: false },
    { id: 'vm13', name: 'VDI-02', hostId: 'h3', os: 'Windows 11', ip: '192.168.10.51', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 6, isStressed: false },
    { id: 'vm14', name: 'VDI-03', hostId: 'h3', os: 'Windows 11', ip: '192.168.10.52', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 6, isStressed: false },
    { id: 'vm15', name: 'VDI-04', hostId: 'h3', os: 'Windows 11', ip: '192.168.10.53', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 6, isStressed: false },
    { id: 'vm16', name: 'VDI-05', hostId: 'h3', os: 'Windows 11', ip: '192.168.10.54', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 6, isStressed: false },
    { id: 'vm17', name: 'MONITOR-01', hostId: 'h3', os: 'Zabbix Appliance', ip: '192.168.10.60', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 12, isStressed: false },
    { id: 'vm18', name: 'LOGS-01', hostId: 'h3', os: 'Graylog', ip: '192.168.10.61', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 15, isStressed: false },

    // Host 4
    { id: 'vm19', name: 'BACKUP-GW', hostId: 'h4', os: 'Proxy Appliance', ip: '192.168.10.99', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 10, isStressed: false },
    { id: 'vm20', name: 'LAB-TEST', hostId: 'h4', os: 'Windows Server 2025', ip: '192.168.10.100', state: 'poweredOn', toolsStatus: 'Running', baseLoad: 5, isStressed: false },
  ]);

  // Estados UI
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, type: SelectionType, id: string} | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [targetHostId, setTargetHostId] = useState<string | null>(null);
  const [simMessage, setSimMessage] = useState("Sistema listo. Seleccione una acción.");
  const logsEndRef = useRef<HTMLDivElement>(null);

  // --- MOTOR DE FÍSICA: CÁLCULO DE CARGA DINÁMICA ---
  // Calcula la carga de un host sumando sus VMs. Si no hay VMs, carga mínima.
  const getHostLoad = (hostId: string, currentVms: VM[] = vms) => {
    const host = hosts.find(h => h.id === hostId);
    
    // Si está desconectado o fallando, carga 0
    if (!host || host.status !== 'connected') return { cpu: 0, mem: 0 };

    // Carga base del hipervisor (ESXi idle)
    let totalCpu = 5; 
    let totalMem = 8; 

    const hostedVms = currentVms.filter(v => v.hostId === hostId && v.state !== 'poweredOff');
    
    hostedVms.forEach(vm => {
        const multiplier = vm.isStressed ? 3.5 : 1; // Factor de estrés aumentado
        totalCpu += (vm.baseLoad * 0.8) * multiplier;
        totalMem += (vm.baseLoad * 1.0) * multiplier;
    });

    return {
        cpu: Math.min(100, Math.round(totalCpu)),
        mem: Math.min(100, Math.round(totalMem))
    };
  };

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // --- LÓGICA DE SIMULACIÓN ---

  // 1. VMOTION MANUAL
  const runVMotion = async (vmId: string, destHostId: string) => {
    setView('INFRASTRUCTURE');
    setSimulation('VMOTION');
    const vmName = vms.find(v => v.id === vmId)?.name;
    const destName = hosts.find(h => h.id === destHostId)?.name;

    setSimMessage(`Iniciando vMotion de ${vmName} hacia ${destName}...`);
    addLog(`Tarea: Migrar ${vmName} a ${destName}. Estado: En Progreso.`);
    
    await delay(5000); 
    setSimMessage("Validando red vMotion y Datastore compartido (Pre-checks)...");
    addLog("Pre-chequeos: Red 10GbE OK. Latencia < 1ms. Almacenamiento accesible.");
    
    await delay(5000);
    setSimMessage("Copiando memoria RAM en caliente (Pre-Copia). La VM sigue encendida...");
    addLog("DataMover: Transfiriendo páginas de memoria activa... (Bulk Copy)");
    
    await delay(5000);
    setSimMessage("Sincronizando últimos cambios (Páginas Sucias / Dirty Pages)...");
    
    await delay(4000);
    setSimMessage("Switchover: Transfiriendo control al host destino (Stun)...");
    addLog("Switchover: STUN momentáneo (< 1s). RARP enviado a la red.");
    
    setVms(prev => prev.map(vm => vm.id === vmId ? { ...vm, hostId: destHostId } : vm));
    
    await delay(4000);
    setSimMessage("vMotion completado exitosamente.");
    addLog(`Tarea: Migrar ${vmName}. Estado: Completado.`);
    setTimeout(() => {
        setSimulation('NONE');
        setView('VCENTER'); 
    }, 4000);
  };

  // 2. HA (FALLO Y RECUPERACIÓN)
  const runHA = async (failedHostId: string) => {
    setView('INFRASTRUCTURE');
    setSimulation('HA');
    const hostName = hosts.find(h => h.id === failedHostId)?.name;

    addLog(`ALERTA: Pérdida de conexión de red con ${hostName}.`);
    setSimMessage(`¡CRÍTICO! ${hostName} no responde. Pérdida de Heartbeat.`);
    
    setHosts(prev => prev.map(h => h.id === failedHostId ? { ...h, status: 'failed' } : h));
    const affectedVMs = vms.filter(v => v.hostId === failedHostId);
    setVms(prev => prev.map(v => v.hostId === failedHostId ? { ...v, state: 'poweredOff' } : v));

    await delay(7000);
    setSimMessage("Validando Datastore Heartbeat para confirmar si es aislamiento o caída total...");
    addLog("Maestro FDM: Verificando archivo de bloqueo en Datastore...");
    await delay(3000);
    addLog("Maestro FDM: Datastore Heartbeat negativo. Host declarado MUERTO.");

    await delay(7000);
    setSimMessage("HA: Calculando plan de reinicio en hosts sobrevivientes...");
    
    const aliveHosts = hosts.filter(h => h.id !== failedHostId && h.status === 'connected');
    
    await delay(5000);
    if (aliveHosts.length === 0) {
        setSimMessage("¡ERROR CRÍTICO! No hay hosts disponibles.");
        return;
    }

    setSimMessage("HA: Reiniciando VMs en hosts disponibles (Prioridad Alta primero)...");
    
    const newVmsState = [...vms];
    affectedVMs.forEach((vm, index) => {
        const targetHost = aliveHosts[index % aliveHosts.length]; 
        addLog(`Reinicio HA: ${vm.name} -> ${targetHost.name}`);
        const vmIndex = newVmsState.findIndex(v => v.id === vm.id);
        if(vmIndex !== -1) {
            newVmsState[vmIndex] = { ...newVmsState[vmIndex], hostId: targetHost.id, state: 'booting' };
        }
    });
    setVms(newVmsState);

    await delay(8000);
    setVms(prev => prev.map(v => v.state === 'booting' ? { ...v, state: 'poweredOn' } : v));
    setSimMessage("Recuperación HA completada. Servicios restaurados.");
    addLog("HA: Todas las VMs protegidas están en línea.");
    
    setTimeout(() => {
        setSimulation('NONE'); 
        setHosts(prev => prev.map(h => h.id === failedHostId ? { ...h, status: 'disconnected' } : h));
        addLog(`Sistema: El host ${hostName} permanece desconectado.`);
        setView('VCENTER');
    }, 6000);
  };

  const powerOnHost = async (hostId: string) => {
      const hostName = hosts.find(h => h.id === hostId)?.name;
      addLog(`Admin: Iniciando reconexión de ${hostName}...`);
      
      // Simular tiempo de boot
      await delay(2000);
      
      // Al conectar, como no tiene VMs asignadas (fueron movidas por HA), su carga será la base (5%)
      setHosts(prev => prev.map(h => h.id === hostId ? { ...h, status: 'connected' } : h));
      addLog(`Sistema: Host ${hostName} reconectado. Estado: Vacío (Sin VMs).`);
  };

  // 3. DRS INTELIGENTE (ALGORITMO REAL)
  const runDRS = async () => {
    setView('INFRASTRUCTURE');
    setSimulation('DRS');
    setSimMessage("Simulando pico de carga masiva en BBDD y Apps Críticas...");
    
    // 1. Inyectar estrés en VMs
    const heavyVMs = ['SRV-SQL01', 'APP-CRM', 'APP-ERP', 'GITLAB', 'LOGS-01'];
    setVms(prev => prev.map(vm => heavyVMs.includes(vm.name) ? { ...vm, isStressed: true } : vm));
    
    addLog("Monitor: Aumento drástico de latencia CPU/RAM detectado en varias VMs.");

    await delay(7000);
    setSimMessage("DRS: Analizando desbalance de carga (Desviación Estándar)...");
    addLog("DRS: Desviación estándar alta. El clúster está desequilibrado.");

    await delay(6000);
    setSimMessage("DRS: Buscando el mejor candidato para migración...");
    
    // 2. ALGORITMO INTELIGENTE: ENCONTRAR HOSTS LIBRES
    // Calcular carga actual de todos los hosts CONECTADOS
    const hostLoads = hosts
        .filter(h => h.status === 'connected')
        .map(h => ({ 
            id: h.id, 
            name: h.name, 
            load: getHostLoad(h.id, vms).cpu // Usar estado actual de VMs
        }))
        .sort((a, b) => a.load - b.load); // Ordenar de menor carga a mayor

    const bestTarget = hostLoads[0]; // El host más vacío (Probablemente el que acabas de prender)
    const worstSource = hostLoads[hostLoads.length - 1]; // El host más lleno

    addLog(`DRS Análisis: Host más saturado: ${worstSource.name} (${worstSource.load}%)`);
    addLog(`DRS Análisis: Host más libre: ${bestTarget.name} (${bestTarget.load}%)`);

    await delay(4000);
    setSimMessage(`DRS: Migrando VMs de ${worstSource.name} hacia ${bestTarget.name}...`);
    
    // 3. Seleccionar VMs para mover del Host Saturado
    const vmsToMove = vms.filter(v => v.hostId === worstSource.id && v.isStressed).slice(0, 2);
    
    if (vmsToMove.length === 0) {
        // Si no hay VMs estresadas, mover cualquiera para balancear
        const anyVms = vms.filter(v => v.hostId === worstSource.id).slice(0, 2);
        vmsToMove.push(...anyVms);
    }

    const newVms = [...vms];
    vmsToMove.forEach((vm) => {
        const vmIdx = newVms.findIndex(v => v.id === vm.id);
        if(vmIdx !== -1) {
            newVms[vmIdx].hostId = bestTarget.id;
            addLog(`DRS vMotion: ${vm.name} -> ${bestTarget.name}`);
        }
    });
    setVms(newVms);

    await delay(8000);
    setSimMessage("Cluster optimizado. Carga distribuida inteligentemente.");
    addLog("DRS: Clúster Balanceado.");

    setTimeout(() => {
        setSimulation('NONE');
        setView('VCENTER');
        setVms(prev => prev.map(vm => ({...vm, isStressed: false})));
    }, 6000);
  };

  // --- HANDLERS UI ---

  const handleTreeClick = (type: SelectionType, id: string) => {
    setSelectedType(type);
    setSelectedId(id);
    setActiveTab('SUMMARY'); 
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, type: SelectionType, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, id });
  };

  const closeMenu = () => setContextMenu(null);

  // --- RENDERIZADORES ---

  const renderInfrastructureView = () => (
    <div className="bg-[#f0f2f5] flex-1 p-6 flex flex-col h-full overflow-hidden animate-in fade-in">
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Activity className={simulation === 'HA' ? 'text-red-500' : 'text-blue-500'} />
                Simulación: {simulation === 'VMOTION' ? 'vMotion en Curso' : simulation === 'HA' ? 'Alta Disponibilidad (HA)' : 'Balanceo DRS'}
            </h2>
            <div className="bg-[#003d79] px-6 py-3 rounded-md text-sm font-bold text-white border border-blue-900 shadow-md tracking-wide">
                {simMessage}
            </div>
        </div>

        <div className="flex-1 grid grid-cols-4 gap-4 overflow-y-auto">
            {hosts.map(host => {
                const hostVms = vms.filter(v => v.hostId === host.id);
                const isFailed = host.status === 'failed';
                const isDisconnected = host.status === 'disconnected';
                // Calcular carga dinámica
                const load = getHostLoad(host.id);
                const isOverloaded = load.cpu > 80;

                return (
                    <div key={host.id} className={`bg-white rounded-lg border-2 p-4 flex flex-col shadow-md transition-all duration-500 ${
                        isFailed ? 'border-red-500 opacity-70 grayscale' : 
                        isDisconnected ? 'border-gray-400 opacity-60 bg-gray-100' :
                        isOverloaded ? 'border-orange-500 ring-2 ring-orange-100' :
                        'border-gray-200'
                    }`}>
                        <div className="flex items-center gap-2 mb-4 border-b pb-2">
                            <Server size={24} className={isFailed || isDisconnected ? 'text-gray-500' : 'text-gray-600'} />
                            <div className="overflow-hidden">
                                <div className="font-bold text-sm truncate">{host.name}</div>
                                <div className="text-xs text-gray-500">{host.ip}</div>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="text-xs">
                                <div className="flex justify-between mb-1"><span>CPU</span><span>{load.cpu}%</span></div>
                                <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                                    <div className={`h-full transition-all duration-1000 ${isFailed || isDisconnected ? 'bg-gray-400' : load.cpu > 80 ? 'bg-orange-500' : 'bg-blue-500'}`} style={{width: `${load.cpu}%`}}></div>
                                </div>
                            </div>
                            <div className="text-xs">
                                <div className="flex justify-between mb-1"><span>MEM</span><span>{load.mem}%</span></div>
                                <div className="h-1.5 bg-gray-200 rounded overflow-hidden">
                                    <div className={`h-full transition-all duration-1000 ${isFailed || isDisconnected ? 'bg-gray-400' : load.mem > 80 ? 'bg-orange-500' : 'bg-green-500'}`} style={{width: `${load.mem}%`}}></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 bg-gray-50 rounded p-2 space-y-2 overflow-y-auto min-h-[100px]">
                            {hostVms.map(vm => (
                                <div key={vm.id} className={`p-2 rounded border text-xs flex items-center gap-2 bg-white shadow-sm transition-all duration-500 ${
                                    vm.state === 'booting' ? 'animate-pulse border-blue-400' : 
                                    vm.state === 'poweredOff' ? 'opacity-50 grayscale' : 
                                    vm.isStressed ? 'border-orange-400 bg-orange-50' :
                                    'border-gray-200'
                                }`}>
                                    <Monitor size={14} className={vm.state === 'poweredOn' ? 'text-green-600' : 'text-gray-400'} />
                                    <span className="truncate font-medium">{vm.name}</span>
                                    {vm.isStressed && <Activity size={10} className="text-orange-500 animate-pulse"/>}
                                </div>
                            ))}
                            {hostVms.length === 0 && !isFailed && !isDisconnected && <div className="text-center text-xs text-gray-400 py-4 italic">Sin VMs</div>}
                            {(isFailed || isDisconnected) && <div className="text-center text-xs text-red-500 font-bold py-4">{isFailed ? 'FALLO CRÍTICO' : 'DESCONECTADO'}</div>}
                        </div>
                    </div>
                )
            })}
        </div>

        <div className="h-48 bg-[#1e1e1e] mt-6 rounded-lg border border-gray-700 font-mono text-xs overflow-hidden flex flex-col shadow-lg">
            <div className="bg-[#252526] px-4 py-2 border-b border-gray-600 text-gray-300 font-bold flex justify-between">
                <span>Registro de Eventos (En Vivo)</span>
                {simulation !== 'NONE' && <span className="text-green-400 animate-pulse">● GRABANDO</span>}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {logs.map((log, i) => (
                    <div key={i} className="text-[#a6e22e] border-l-2 border-[#a6e22e] pl-2">{log}</div>
                ))}
                <div ref={logsEndRef}/>
            </div>
        </div>
    </div>
  );

  const renderVCenterView = () => (
    <div className="flex flex-1 overflow-hidden" onClick={closeMenu}>
        <div className="w-[280px] bg-white border-r border-gray-300 flex flex-col">
            <div className="p-3 bg-[#f1f3f5] border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase">Explorador</div>
            <div className="flex-1 overflow-y-auto p-2 text-[13px] text-[#2d3640]">
                <div 
                    className={`flex items-center gap-1.5 py-1 px-2 cursor-pointer ${selectedId === 'dc1' ? 'bg-[#cde6f7] border-l-[3px] border-[#007cbb]' : 'hover:bg-[#e1f0fa]'}`}
                    onClick={() => handleTreeClick('DATACENTER', 'dc1')}
                >
                    <Globe size={14} className="text-gray-500"/> Riveritatech
                </div>

                <div 
                    className={`ml-4 flex items-center gap-1.5 py-1 px-2 cursor-context-menu ${selectedId === 'cluster1' ? 'bg-[#cde6f7] border-l-[3px] border-[#007cbb]' : 'hover:bg-[#e1f0fa]'}`}
                    onClick={() => handleTreeClick('CLUSTER', 'cluster1')}
                    onContextMenu={(e) => handleContextMenu(e, 'CLUSTER', 'cluster1')}
                >
                    <Layers size={14} className="text-gray-500"/> ClusterLab
                </div>

                {hosts.map(host => (
                    <div key={host.id}>
                        <div 
                            className={`ml-8 flex items-center gap-1.5 py-1 px-2 cursor-context-menu ${selectedId === host.id ? 'bg-[#cde6f7] border-l-[3px] border-[#007cbb]' : 'hover:bg-[#e1f0fa]'}`}
                            onClick={() => handleTreeClick('HOST', host.id)}
                            onContextMenu={(e) => handleContextMenu(e, 'HOST', host.id)}
                        >
                            <Server size={14} className={host.status === 'connected' ? 'text-gray-600' : 'text-red-500'}/> 
                            <span className={host.status !== 'connected' ? 'text-red-600 italic' : ''}>{host.name} {host.status !== 'connected' && '(No responde)'}</span>
                        </div>
                        {host.status === 'connected' && vms.filter(v => v.hostId === host.id).map(vm => (
                            <div 
                                key={vm.id}
                                className={`ml-12 flex items-center gap-1.5 py-0.5 px-2 cursor-context-menu ${selectedId === vm.id ? 'bg-[#cde6f7] border-l-[3px] border-[#007cbb]' : 'hover:bg-[#e1f0fa]'}`}
                                onClick={() => handleTreeClick('VM', vm.id)}
                                onContextMenu={(e) => handleContextMenu(e, 'VM', vm.id)}
                            >
                                <Monitor size={12} className={vm.state === 'poweredOn' ? 'text-green-600' : 'text-gray-400'}/> {vm.name}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>

        <div className="flex-1 flex flex-col bg-[#f5f7fa] overflow-hidden">
            {renderMainContent()}
        </div>
    </div>
  );

  const renderMainContent = () => {
    let title = "";
    let icon = null;
    let details = null;

    if (selectedType === 'CLUSTER') {
        title = "ClusterLab";
        icon = <Layers size={40} strokeWidth={1.5} />;
        
        const hostsTabContent = (
            <div className="bg-white rounded-sm border border-gray-300 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-[#fafafa] border-b border-gray-200 text-xs font-bold uppercase">
                        <tr>
                            <th className="px-4 py-3">Nombre</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3">CPU %</th>
                            <th className="px-4 py-3">Memoria %</th>
                            <th className="px-4 py-3">VMs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hosts.map(h => {
                            const isDown = h.status !== 'connected';
                            const load = getHostLoad(h.id);
                            return (
                                <tr key={h.id} className="border-b border-gray-100 hover:bg-[#f5fafa]">
                                    <td className="px-4 py-3 flex items-center gap-2">
                                        <Server size={14} className={isDown ? "text-red-500" : "text-gray-500"}/> 
                                        <span className={isDown ? "text-red-600" : ""}>{h.name}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {isDown ? (
                                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs border border-red-200">No responde</span>
                                        ) : (
                                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs border border-green-200">Conectado</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 w-32">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className={`h-full ${isDown ? 'bg-gray-300' : load.cpu > 80 ? 'bg-orange-500' : 'bg-blue-500'}`} style={{width: `${load.cpu}%`}}></div>
                                            </div>
                                            <span className="text-xs w-8 text-right">{load.cpu}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 w-32">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className={`h-full ${isDown ? 'bg-gray-300' : load.mem > 80 ? 'bg-orange-500' : 'bg-green-500'}`} style={{width: `${load.mem}%`}}></div>
                                            </div>
                                            <span className="text-xs w-8 text-right">{load.mem}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">{vms.filter(v => v.hostId === h.id).length}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );

        const summaryTabContent = (
            <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-white p-4 rounded border border-gray-300 shadow-sm text-center">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Capacidad CPU</div>
                        <div className="text-2xl text-[#2d3640] font-light">224 GHz</div>
                    </div>
                    <div className="bg-white p-4 rounded border border-gray-300 shadow-sm text-center">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Capacidad Memoria</div>
                        <div className="text-2xl text-[#2d3640] font-light">2.0 TB</div>
                    </div>
                    <div className="bg-white p-4 rounded border border-gray-300 shadow-sm text-center">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Total Hosts</div>
                        <div className="text-2xl text-[#2d3640] font-light">{hosts.length}</div>
                    </div>
                    <div className="bg-white p-4 rounded border border-gray-300 shadow-sm text-center">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-1">Total VMs</div>
                        <div className="text-2xl text-[#2d3640] font-light">{vms.length}</div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-300">
                    <h3 className="font-bold text-sm text-gray-700 border-b pb-2 mb-3">Servicios del Clúster</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span>vSphere DRS</span> 
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold border border-green-200">Totalmente Automatizado</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>vSphere HA</span> 
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold border border-green-200">Activado</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>vSAN</span> 
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold border border-gray-300">Desactivado</span>
                        </div>
                    </div>
                </div>
                <div className="bg-blue-50 p-6 rounded-sm shadow-sm border border-blue-200 flex flex-col items-center justify-center text-center">
                    <Scale size={32} className="text-blue-500 mb-2"/>
                    <h3 className="font-bold text-gray-700">Puntaje DRS: 98%</h3>
                    <p className="text-xs text-gray-500 mt-1">El clúster está balanceado. Para probar DRS, haz clic derecho en ClusterLab.</p>
                </div>
            </div>
        );

        details = activeTab === 'HOSTS' ? hostsTabContent : summaryTabContent;

    } else if (selectedType === 'HOST') {
        const host = hosts.find(h => h.id === selectedId);
        title = host?.name || "Host";
        icon = <Server size={40} strokeWidth={1.5} />;
        
        const configTabContent = (
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-300">
                    <h3 className="font-bold text-sm text-gray-700 border-b pb-2 mb-3 flex items-center gap-2">
                        <Network size={16}/> Adaptadores VMkernel
                    </h3>
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-[#fafafa] border-b border-gray-200 text-xs font-bold uppercase">
                            <tr>
                                <th className="px-4 py-2">Dispositivo</th>
                                <th className="px-4 py-2">Grupo de Puertos</th>
                                <th className="px-4 py-2">Dirección IPv4</th>
                                <th className="px-4 py-2">Servicios</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-100">
                                <td className="px-4 py-2 font-mono text-xs">vmk0</td>
                                <td className="px-4 py-2">Management Network</td>
                                <td className="px-4 py-2">{host?.ip}</td>
                                <td className="px-4 py-2"><span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">Management</span></td>
                            </tr>
                            <tr>
                                <td className="px-4 py-2 font-mono text-xs">vmk1</td>
                                <td className="px-4 py-2">vMotion Network</td>
                                <td className="px-4 py-2">10.10.10.{host?.ip.split('.')[3]}</td>
                                <td className="px-4 py-2"><span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-xs">vMotion</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );

        const summaryHostContent = (
            <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-300">
                <h3 className="font-bold text-sm text-gray-700 border-b pb-2 mb-3">Resumen del Host</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Hipervisor:</span> <span>VMware ESXi, 8.0.3, 2402251</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Modelo:</span> <span>Dell PowerEdge R750</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Procesador:</span> <span>Intel(R) Xeon(R) Gold 6348</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Estado:</span> 
                        <span className={host?.status !== 'connected' ? 'text-red-600 font-bold' : 'text-green-600'}>
                            {host?.status === 'connected' ? 'Conectado' : 'No responde'}
                        </span>
                    </div>
                    {host?.status !== 'connected' && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                            <AlertTriangle size={16}/> 
                            <div>
                                <strong>Host Desconectado.</strong> Haz clic derecho en el host y selecciona "Conectar / Encender" para restaurarlo.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );

        details = activeTab === 'CONFIGURE' ? configTabContent : summaryHostContent;

    } else if (selectedType === 'VM') {
        const vm = vms.find(v => v.id === selectedId);
        const host = hosts.find(h => h.id === vm?.hostId);
        title = vm?.name || "VM";
        icon = <Monitor size={40} strokeWidth={1.5} />;
        details = (
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-300">
                    <h3 className="font-bold text-sm text-gray-700 border-b pb-2 mb-3">Hardware de la VM</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">SO Invitado:</span> <span>{vm?.os}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Compatibilidad:</span> <span>ESXi 8.0 U2 y superior (v21)</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">VMware Tools:</span> <span className="text-green-600">Ejecutándose (13.0.5)</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Dirección IP:</span> <span className="text-blue-600">{vm?.ip}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Host:</span> <span className="text-blue-600 underline cursor-pointer">{host?.name}</span></div>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-sm shadow-sm border border-gray-300 flex flex-col items-center justify-center text-center">
                    <ArrowRightLeft size={32} className="text-blue-500 mb-2"/>
                    <h3 className="font-bold text-gray-700">Acciones Rápidas</h3>
                    <p className="text-xs text-gray-500 mt-1">Haz clic derecho en esta VM en el menú lateral para iniciar una migración (vMotion).</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Object Header */}
            <div className="bg-white px-6 pt-5 pb-0 border-b border-gray-300 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                    <div className="bg-[#007cbb] p-2 rounded-sm text-white shadow-sm">
                        {icon}
                    </div>
                    <div>
                        <h1 className="text-2xl font-normal text-[#2d3640]">{title}</h1>
                        <div className="flex gap-4 text-[11px] text-gray-500 mt-1">
                            {selectedType === 'VM' && <span className="bg-green-100 text-green-800 px-1.5 rounded border border-green-200">Encendido</span>}
                            <span>Riveritatech &gt; ClusterLab</span>
                        </div>
                    </div>
                </div>
                {/* Tabs */}
                <div className="flex gap-8 text-[13px] font-medium text-gray-600">
                    <div 
                        className={`pb-3 border-b-[3px] cursor-pointer ${activeTab === 'SUMMARY' ? 'border-[#007cbb] text-[#007cbb]' : 'border-transparent hover:border-gray-300'}`}
                        onClick={() => setActiveTab('SUMMARY')}
                    >
                        Resumen
                    </div>
                    <div className="pb-3 border-b-[3px] border-transparent hover:border-gray-300 cursor-pointer">Supervisar</div>
                    
                    <div 
                        className={`pb-3 border-b-[3px] cursor-pointer ${activeTab === 'CONFIGURE' ? 'border-[#007cbb] text-[#007cbb]' : 'border-transparent hover:border-gray-300'}`}
                        onClick={() => setActiveTab('CONFIGURE')}
                    >
                        Configurar
                    </div>
                    
                    {selectedType === 'CLUSTER' && (
                        <div 
                            className={`pb-3 border-b-[3px] cursor-pointer ${activeTab === 'HOSTS' ? 'border-[#007cbb] text-[#007cbb]' : 'border-transparent hover:border-gray-300'}`}
                            onClick={() => setActiveTab('HOSTS')}
                        >
                            Hosts
                        </div>
                    )}
                </div>
            </div>
            
            {/* Content Body */}
            <div className="p-6 overflow-y-auto">
                {details}
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-screen font-sans text-[#2d3640]">
        
        {/* Header Global */}
        <div className="bg-[#1e2730] text-white h-[48px] flex items-center justify-between px-4 border-b border-[#444] shrink-0 z-50">
            <div className="flex items-center gap-6">
                <div className="font-semibold text-lg flex items-center gap-2">
                   <span className="font-bold">VMware</span> vSphere Client
                </div>
                <div className="text-gray-400 text-sm border-l border-gray-600 pl-4 cursor-pointer hover:text-white">Menú</div>
            </div>
            <div className="flex items-center gap-4">
                <Search size={16} className="text-gray-400 cursor-pointer"/>
                <Bell size={16} className="text-gray-400 cursor-pointer"/>
                <HelpCircle size={16} className="text-gray-400 cursor-pointer"/>
                <div className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <User size={16}/>
                    <span>administrator@riveritatech.local</span>
                </div>
            </div>
        </div>

        {/* View Switcher Logic */}
        {view === 'VCENTER' ? renderVCenterView() : renderInfrastructureView()}

        {/* CONTEXT MENUS */}
        {contextMenu && (
            <div 
                className="fixed bg-white shadow-xl border border-gray-300 py-1 w-64 z-[9999] text-[13px] text-[#2d3640] rounded-sm"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onClick={(e) => e.stopPropagation()} 
            >
                {contextMenu.type === 'CLUSTER' && (
                    <>
                        <div className="px-4 py-1.5 hover:bg-[#e1f0fa] cursor-pointer">Añadir Host...</div>
                        <div className="px-4 py-1.5 hover:bg-[#e1f0fa] cursor-pointer">Configuración...</div>
                        <div className="h-px bg-gray-200 my-1"></div>
                        <div className="px-4 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white cursor-pointer font-bold flex gap-2 items-center" onClick={runDRS}>
                            <Scale size={14}/> Simular Carga DRS
                        </div>
                    </>
                )}
                {contextMenu.type === 'HOST' && (
                    <>
                        <div className="px-4 py-1.5 hover:bg-[#e1f0fa] cursor-pointer">Modo Mantenimiento</div>
                        <div className="h-px bg-gray-200 my-1"></div>
                        {hosts.find(h => h.id === contextMenu.id)?.status === 'connected' ? (
                            <div className="px-4 py-1.5 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white cursor-pointer font-bold flex gap-2 items-center" onClick={() => {
                                setContextMenu(null);
                                runHA(contextMenu.id);
                            }}>
                                <Zap size={14}/> Simular Fallo Energía (HA)
                            </div>
                        ) : (
                            <div className="px-4 py-1.5 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white cursor-pointer font-bold flex gap-2 items-center" onClick={() => {
                                setContextMenu(null);
                                powerOnHost(contextMenu.id);
                            }}>
                                <Power size={14}/> Conectar / Encender
                            </div>
                        )}
                    </>
                )}
                {contextMenu.type === 'VM' && (
                    <>
                        <div className="px-4 py-1.5 hover:bg-[#e1f0fa] cursor-pointer">Encendido</div>
                        <div className="px-4 py-1.5 hover:bg-[#e1f0fa] cursor-pointer">Instantáneas</div>
                        <div className="h-px bg-gray-200 my-1"></div>
                        <div className="px-4 py-1.5 hover:bg-[#007cbb] hover:text-white cursor-pointer font-bold flex gap-2 items-center" onClick={() => {
                            setContextMenu(null);
                            // RESET del Wizard
                            setTargetHostId(null);
                            setWizardStep(1);
                            setShowWizard(true);
                        }}>
                            <ArrowRightLeft size={14}/> Migrar...
                        </div>
                    </>
                )}
            </div>
        )}

        {/* Global Click Handler to close Menu */}
        {contextMenu && <div className="fixed inset-0 z-[9998]" onClick={closeMenu}></div>}

        {/* WIZARD vMOTION */}
        {showWizard && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-[10000] font-sans">
                <div className="bg-white rounded-sm shadow-2xl w-[700px] h-[550px] flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
                        <h2 className="text-xl font-normal text-[#2d3640]">Migrar - {vms.find(v => v.id === selectedId)?.name}</h2>
                        <X size={20} className="text-gray-400 cursor-pointer" onClick={() => setShowWizard(false)}/>
                    </div>
                    <div className="flex-1 flex overflow-hidden">
                        <div className="w-[200px] bg-[#fafafa] border-r border-gray-200 pt-6 hidden sm:block">
                            <div className={`px-6 py-2 text-[13px] ${wizardStep === 1 ? 'font-bold border-l-[3px] border-[#007cbb] bg-white' : 'text-gray-500'}`}>1. Tipo de migración</div>
                            <div className={`px-6 py-2 text-[13px] ${wizardStep === 2 ? 'font-bold border-l-[3px] border-[#007cbb] bg-white' : 'text-gray-500'}`}>2. Recurso informático</div>
                            <div className={`px-6 py-2 text-[13px] ${wizardStep === 3 ? 'font-bold border-l-[3px] border-[#007cbb] bg-white' : 'text-gray-500'}`}>3. Revisar</div>
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto bg-white">
                            {wizardStep === 1 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-normal">Seleccione un tipo de migración</h3>
                                    <label className="flex gap-3 p-4 border border-[#007cbb] bg-[#f5fafe] rounded-sm ring-1 ring-[#007cbb]">
                                        <div className="mt-1 w-4 h-4 rounded-full border-[5px] border-[#007cbb] bg-white"></div>
                                        <div>
                                            <div className="font-bold text-sm">Cambiar solo recurso informático</div>
                                            <div className="text-xs text-gray-500">Migrar la máquina virtual a otro host o clúster.</div>
                                        </div>
                                    </label>
                                </div>
                            )}
                            {wizardStep === 2 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-normal">Seleccione el recurso de destino</h3>
                                    <div className="border border-gray-300 h-[200px] overflow-y-auto p-2">
                                        <div className="text-xs font-bold text-gray-500 mb-2">ClusterLab</div>
                                        {hosts.map(h => {
                                            const isAvailable = h.status === 'connected';
                                            const isCurrent = h.id === vms.find(v => v.id === selectedId)?.hostId;
                                            
                                            // Estilos para deshabilitar host actual o desconectado
                                            const disabled = !isAvailable || isCurrent;
                                            
                                            return (
                                                <div 
                                                    key={h.id} 
                                                    className={`flex items-center gap-2 p-2 text-sm cursor-pointer ${
                                                        !isAvailable ? 'opacity-50 cursor-not-allowed bg-red-50 text-red-800' :
                                                        isCurrent ? 'opacity-50 cursor-not-allowed bg-gray-100' :
                                                        targetHostId === h.id ? 'bg-[#cde6f7]' : 'hover:bg-[#f1f3f5]'
                                                    }`}
                                                    onClick={() => !disabled && setTargetHostId(h.id)}
                                                >
                                                    <Server size={14} className={!isAvailable ? 'text-red-500' : ''}/> 
                                                    {h.name} 
                                                    {!isAvailable && ' (Desconectado)'}
                                                    {isCurrent && ' (Actual)'}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {targetHostId && (
                                        <div className="bg-[#eaf7ed] border border-[#c4e1cd] p-3 text-sm flex gap-2 text-[#1e522d]">
                                            <CheckCircle size={16}/> Las comprobaciones de compatibilidad se realizaron correctamente.
                                        </div>
                                    )}
                                </div>
                            )}
                            {wizardStep === 3 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-normal">Revisar selecciones</h3>
                                    <div className="text-sm space-y-2 border p-4">
                                        <div className="flex justify-between"><span>VM:</span> <strong>{vms.find(v => v.id === selectedId)?.name}</strong></div>
                                        <div className="flex justify-between"><span>Destino:</span> <strong>{hosts.find(h => h.id === targetHostId)?.name}</strong></div>
                                        <div className="flex justify-between"><span>Prioridad:</span> <strong>Alta</strong></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-[#fafafa]">
                        <button className="px-5 py-1.5 text-sm border bg-white" onClick={() => setShowWizard(false)}>Cancelar</button>
                        {wizardStep < 3 ? (
                            <button className="px-5 py-1.5 text-sm bg-[#007cbb] text-white" onClick={() => setWizardStep(s => s+1)} disabled={wizardStep === 2 && !targetHostId}>Siguiente</button>
                        ) : (
                            <button className="px-5 py-1.5 text-sm bg-[#007cbb] text-white" onClick={() => {
                                setShowWizard(false);
                                if(targetHostId) runVMotion(selectedId, targetHostId);
                            }}>Finalizar</button>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default RiveritatechLab;
