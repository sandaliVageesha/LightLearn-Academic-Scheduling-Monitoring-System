import { useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Sector } from 'recharts';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { PieChart as PieIcon } from 'lucide-react';
import ChartTooltip from './ChartTooltip';

function ActiveSlice(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      cornerRadius={6}
    />
  );
}

/**
 * data: [{ name, value, color }]
 */
export default function DonutChartCard({ title, icon: Icon = PieIcon, data = [], height = 220 }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-ink-faint" />
        {title}
      </h2>

      {total === 0 ? (
        <EmptyState icon={Icon} title="No data yet" />
      ) : (
        <div className="flex items-center gap-6 flex-wrap">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{ width: height, height }}
            className="shrink-0 relative"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="90%"
                  paddingAngle={3}
                  cornerRadius={6}
                  strokeWidth={0}
                  animationDuration={700}
                  animationEasing="ease-out"
                  activeIndex={activeIndex}
                  activeShape={ActiveSlice}
                  onMouseEnter={(_, i) => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.color}
                      className="transition-opacity duration-150"
                      opacity={activeIndex === null || activeIndex === i ? 1 : 0.35}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-display font-bold text-ink">
                {activeIndex !== null ? data[activeIndex].value : total}
              </span>
              <span className="text-[10px] text-ink-faint uppercase tracking-wide">
                {activeIndex !== null ? data[activeIndex].name : 'Total'}
              </span>
            </div>
          </motion.div>

          <div className="flex flex-col gap-2 flex-1 min-w-[140px]">
            {data.map((d, i) => (
              <div
                key={d.name}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex items-center justify-between gap-3 text-sm rounded-lg px-1.5 py-1 -mx-1.5 cursor-default transition-colors ${
                  activeIndex === i ? 'bg-ink/[0.04]' : ''
                }`}
              >
                <span className="flex items-center gap-2 text-ink-soft">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
                <span className="font-semibold text-ink tabular-nums">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
