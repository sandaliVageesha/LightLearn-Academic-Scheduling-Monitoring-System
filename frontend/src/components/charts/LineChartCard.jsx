import { useId } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import Card from '../ui/Card';
import { TrendingUp } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { CHART_COLORS } from './chartColors';
import ChartTooltip from './ChartTooltip';

/**
 * data: [{ name, value }]
 */
export default function LineChartCard({ title, icon: Icon = TrendingUp, data = [], color = '#00A0F5', height = 220 }) {
  const { theme } = useTheme();
  const c = CHART_COLORS[theme];
  // useId() includes colons (e.g. ":r0:"), which break when referenced via
  // url(#id) in SVG fill/filter attributes — strip them.
  const uid = useId().replace(/:/g, '');
  const fillId = `lineFill-${uid}`;
  const glowId = `lineGlow-${uid}`;

  return (
    <Card>
      <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-ink-faint" />
        {title}
      </h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="60%" stopColor={color} stopOpacity={0.08} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
              <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={c.grid} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: c.tick }} axisLine={{ stroke: c.axisLine }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: c.tick }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: c.axisLine, strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#${fillId})`}
              style={{ filter: `url(#${glowId})` }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: color }}
              animationDuration={700}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </Card>
  );
}
