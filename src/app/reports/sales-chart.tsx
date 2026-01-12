'use client';

import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface BarChartData {
    name: string;
    vendido: number;
    perdido: number;
    pendente: number;
}

interface PieChartData {
    name: string;
    value: number;
    fill: string;
}

interface SalesChartProps {
    data: BarChartData[] | PieChartData[];
    type: 'bar' | 'pie';
}

const formatCurrency = (value: number) => {
    if (value >= 1000000) {
        return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
                <p className="font-medium text-slate-900 dark:text-white mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const entry = payload[0];
        return (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
                <p className="font-medium text-slate-900 dark:text-white">{entry.name}</p>
                <p className="text-sm" style={{ color: entry.payload.fill }}>
                    R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
            </div>
        );
    }
    return null;
};

export function SalesChart({ data, type }: SalesChartProps) {
    if (type === 'pie') {
        const pieData = data as PieChartData[];
        const total = pieData.reduce((sum, item) => sum + item.value, 0);

        return (
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value, entry: any) => (
                                <span className="text-sm text-slate-600 dark:text-slate-400">{value}</span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Total: <span className="font-semibold text-slate-900 dark:text-white">
                            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </p>
                </div>
            </div>
        );
    }

    const barData = data as BarChartData[];

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis
                        dataKey="name"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                        tickFormatter={formatCurrency}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="top"
                        height={36}
                        formatter={(value) => (
                            <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">{value}</span>
                        )}
                    />
                    <Bar
                        dataKey="vendido"
                        fill="#10b981"
                        name="Vendido"
                        radius={[4, 4, 0, 0]}
                    />
                    <Bar
                        dataKey="perdido"
                        fill="#ef4444"
                        name="Perdido"
                        radius={[4, 4, 0, 0]}
                    />
                    <Bar
                        dataKey="pendente"
                        fill="#f59e0b"
                        name="Pendente"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
