import { useId } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { BarChart3 } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { CHART_COLORS } from './chartColors';
import ChartTooltip from './ChartTooltip';

/**
 * data: [{ name, value }]
 */
export default function BarChartCard({ title, icon: Icon = BarChart3, data = [], color = '#00A0F5', height = 220 }) {
  const { theme } = useTheme();
  const c = CHART_COLORS[theme];
  // useId() includes colons (e.g. ":r0:"), which break when referenced via
  // url(#id) in SVG fill/filter attributes — strip them.
  const gradientId = `barFill-${useId().replace(/:/g, '')}`;

  return (
    <Card>
      <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-ink-faint" />
        {title}
      </h2>

      {data.length === 0 ? (
        <EmptyState icon={Icon} title="No data yet" />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="28%">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={c.grid} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: c.tick }}
                axisLine={{ stroke: c.axisLine }}
                tickLine={false}
                interval={0}
                angle={data.length > 5 ? -25 : 0}
                textAnchor={data.length > 5 ? 'end' : 'middle'}
                height={data.length > 5 ? 46 : 24}
              />
              <YAxis tick={{ fontSize: 11, fill: c.tick }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: c.cursor, radius: 8 }} />
              <Bar
                dataKey="value"
                fill={`url(#${gradientId})`}
                radius={[8, 8, 3, 3]}
                maxBarSize={34}
                animationDuration={700}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </Card>
  );
}
