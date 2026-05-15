import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, Clock, Zap } from 'lucide-react';
import { telemetry, TelemetryPayload } from '../../../core/observability/telemetry';

export default function TelemetryStreamWidget() {
    const [events, setEvents] = useState<TelemetryPayload[]>([]);

    useEffect(() => {
        // Load initial history
        setEvents(telemetry.getHistory().slice(0, 50));

        // Subscribe to new events
        const unsubscribe = telemetry.subscribe((payload) => {
            setEvents(prev => [payload, ...prev].slice(0, 50));
        });

        return () => unsubscribe();
    }, []);

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-slate-300 relative border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-4 z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center">
                        <Activity size={16} className="text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold tracking-tight">Live Telemetry</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">System Traces</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded border border-slate-800 bg-slate-800/50 text-[10px] font-bold text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        STREAMING
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2 z-10">
                {events.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-slate-600 text-xs font-mono">
                        No recent telemetry events captured.
                    </div>
                )}
                {events.map((evt, i) => (
                    <div key={`${evt.timestamp}-${i}`} className="flex flex-col gap-1 text-xs font-mono bg-slate-800/50 hover:bg-slate-800 p-2.5 rounded-lg border border-transparent hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 w-[60px] shrink-0">{formatTime(evt.timestamp)}</span>
                                <span className={`font-bold ${evt.error ? 'text-red-400' : 'text-blue-400'}`}>
                                    {evt.event}
                                </span>
                            </div>
                            {evt.duration && (
                                <span className="text-emerald-500/80 shrink-0">{evt.duration.toFixed(0)}ms</span>
                            )}
                        </div>
                        {evt.error && (
                            <div className="pl-[68px] text-red-300 text-[10px]">
                                {String(evt.error)}
                            </div>
                        )}
                        {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                            <div className="pl-[68px] text-slate-500 text-[10px] truncate">
                                {JSON.stringify(evt.metadata)}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Faded overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none z-20"></div>
        </div>
    );
}
