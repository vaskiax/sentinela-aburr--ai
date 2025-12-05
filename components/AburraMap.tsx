import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ABURRA_ZONES } from '../constants';

interface AburraMapProps {
  zoneRisks: { zone: string; risk: number }[];
}

const AburraMap: React.FC<AburraMapProps> = ({ zoneRisks }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const ALL_ZONES = [...ABURRA_ZONES, { id: 'SAB', name: 'Sabaneta' }, { id: 'EST', name: 'La Estrella' }];

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 400;
    const height = 500;
    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove(); // Clear previous

    // Create a stylized grid layout for the map (Abstract representation)
    const xScale = d3.scaleLinear().domain([0, 4]).range([20, width - 20]);
    const yScale = d3.scaleLinear().domain([0, 8]).range([20, height - 20]);

    // Manual abstract coordinates for zones to resemble the valley vertically
    const zoneCoords: Record<string, [number, number]> = {
      'BEL': [2, 1], // Bello (North)
      'C01': [3, 2], 'C02': [3, 3], 'C03': [3, 4], 'C04': [3, 5],
      'C05': [1, 3], 'C06': [1, 2], 'C07': [0, 4],
      'C08': [4, 5], 'C09': [4, 6],
      'C10': [2, 5], // Center
      'C11': [1, 5], 'C12': [0, 5], 'C13': [0, 6],
      'C14': [3, 7], // Poblado
      'C15': [1, 7],
      'C16': [0, 7],
      'ITA': [1, 8], // South
      'ENV': [3, 8], // South
      'SAB': [2, 8.5], // Sabaneta (South-Center)
      'EST': [1, 9], // La Estrella (Deep South)
    };

    // Draw Connections (The river/valley flow)
    svg.append("line")
      .attr("x1", xScale(2))
      .attr("y1", yScale(0))
      .attr("x2", xScale(2))
      .attr("y2", yScale(9.5))
      .attr("stroke", "#334155")
      .attr("stroke-width", 20)
      .attr("stroke-linecap", "round");

    ALL_ZONES.forEach((zone) => {
      const coords = zoneCoords[zone.id] || [2, 4]; // Default to center if missing

      // Find risk for this zone - match by ID, full name, or stripped name (case-insensitive)
      const riskData = zoneRisks.find(zr => {
        const zrZone = String(zr.zone || '').toLowerCase().trim();
        const zoneName = String(zone.name || '').toLowerCase().trim();
        const strippedName = zoneName.split('(')[0].trim(); // "Itagüí (General)" -> "Itagüí"
        const zoneId = String(zone.id || '').toLowerCase().trim();
        
        // Match: exact ID, exact name, or backend zone matches stripped name
        return zoneId === zrZone || zoneName === zrZone || zrZone === strippedName || zoneName.includes(zrZone);
      });
      const riskScore = riskData ? riskData.risk : 0;

      // Determine color based on risk score (matches Documentation semáforo)
      let fillColor = "#10b981"; // 0-20: Green (default)
      let strokeColor = "#6ee7b7";

      if (riskScore > 80) {
        fillColor = "#ef4444"; // 81-100: Red (Critical)
        strokeColor = "#fca5a5";
      } else if (riskScore > 60) {
        fillColor = "#f97316"; // 61-80: Orange (Elevated)
        strokeColor = "#fdba74";
      } else if (riskScore > 40) {
        fillColor = "#fbbf24"; // 41-60: Yellow (Caution)
        strokeColor = "#fcd34d";
      } else if (riskScore > 20) {
        fillColor = "#06b6d4"; // 21-40: Cyan/Blue (Active)
        strokeColor = "#67e8f9";
      }

      const g = svg.append("g")
        .attr("transform", `translate(${xScale(coords[0])}, ${yScale(coords[1])})`);

      // Hexagon or Circle shape
      g.append("circle")
        .attr("r", 20)
        .attr("fill", fillColor)
        .attr("stroke", strokeColor)
        .attr("stroke-width", 2)
        .transition()
        .duration(1000)
        .attr("r", riskScore > 40 ? 24 : 20);

      if (riskScore > 80) {
        // Pulse effect for critical zones (81-100%)
        const pulse = g.append("circle")
          .attr("r", 20)
          .attr("fill", "none")
          .attr("stroke", fillColor)
          .attr("stroke-width", 1)
          .attr("opacity", 1);

        const repeatPulse = () => {
          pulse
            .attr("r", 20)
            .attr("opacity", 1)
            .transition()
            .duration(1500)
            .ease(d3.easeLinear)
            .attr("r", 40)
            .attr("opacity", 0)
            .on("end", repeatPulse);
        };

        repeatPulse();
      }

      g.append("text")
        .text(zone.id)
        .attr("text-anchor", "middle")
        .attr("dy", 4)
        .attr("fill", "white")
        .attr("font-size", "10px")
        .attr("font-weight", "bold");

      // Add tooltip-like text below if high risk
      if (riskScore > 30) {
        g.append("text")
          .text(Math.round(riskScore).toString())
          .attr("text-anchor", "middle")
          .attr("dy", 20)
          .attr("fill", strokeColor)
          .attr("font-size", "9px")
          .attr("font-weight", "bold");
      }
    });

  }, [zoneRisks]);

  return (
    <div className="flex h-full gap-4">
      {/* Map */}
      <div className="flex-1 flex flex-col items-center bg-slate-900 rounded-lg p-4 border border-slate-800 shadow-xl relative">
        <h3 className="text-slate-400 text-sm font-semibold mb-2 uppercase tracking-wider absolute top-4 left-4">Spatial Risk Map</h3>
        <svg ref={svgRef} width={400} height={500} className="overflow-visible" />
        <div className="absolute bottom-4 left-4 flex flex-col gap-2 text-xs text-slate-500 bg-slate-950/80 p-2 rounded border border-slate-800">
          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div> 0-20% (Green)</div>
          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-cyan-500 mr-2"></div> 21-40% (Cyan)</div>
          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div> 41-60% (Yellow)</div>
          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div> 61-80% (Orange)</div>
          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div> 81-100% (Red)</div>
        </div>
      </div>

      {/* Zone Glossary Side Panel */}
      <div className="w-48 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
        <div className="bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 uppercase">Zone Codes</div>
        <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
          <table className="w-full text-[10px] text-slate-400">
            <tbody>
              {ALL_ZONES.map(z => {
                const riskData = zoneRisks.find(zr => {
                  const zrZone = String(zr.zone || '').toLowerCase().trim();
                  const zoneName = String(z.name || '').toLowerCase().trim();
                  const strippedName = zoneName.split('(')[0].trim();
                  const zoneId = String(z.id || '').toLowerCase().trim();
                  return zoneId === zrZone || zoneName === zrZone || zrZone === strippedName || zoneName.includes(zrZone);
                });
                const score = riskData ? riskData.risk : 0;
                const mentions = riskData ? (riskData.mentions || 0) : 0;
                const breakdown = (riskData && Array.isArray(riskData.breakdown)) ? riskData.breakdown.slice(0, 6) : [];
                const breakdownText = breakdown.length
                  ? breakdown.map(b => `${b.barrio}: ${b.mentions}`).join(' | ')
                  : '';
                let rowClass = "";
                if (score > 80) rowClass = "text-red-400 font-bold bg-red-900/10";
                else if (score > 60) rowClass = "text-orange-400 font-bold bg-orange-900/10";
                else if (score > 40) rowClass = "text-yellow-400 font-bold bg-yellow-900/10";
                else if (score > 20) rowClass = "text-cyan-400 font-bold bg-cyan-900/10";

                return (
                  <tr
                    key={z.id}
                    className={`border-b border-slate-800 ${rowClass}`}
                    title={breakdownText || undefined}
                  >
                    <td className="py-1 px-1 font-mono">{z.id}</td>
                    <td className="py-1 px-1">{z.name}</td>
                    <td className="py-1 px-1 text-right">{mentions > 0 ? mentions : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AburraMap;