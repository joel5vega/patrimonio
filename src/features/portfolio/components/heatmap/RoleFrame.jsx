import React from 'react';
import { ROLE_META } from './assetMeta';

// Marco + cabecera de un rol. Los tiles se pintan aparte, encima del marco.
export default function RoleFrame({ role, totalValueUSD }) {
  const meta = ROLE_META[role.key] ?? ROLE_META.unclassified;
  const pct = totalValueUSD > 0 ? (role.total / totalValueUSD) * 100 : 0;
  const Icon = meta.Icon;

  return (
    <div
      className="hm-role"
      style={{
        left: role.x,
        top: role.y,
        width: role.w,
        height: role.h,
        '--role-color': meta.color,
      }}
    >
      {role.showHeader && (
        <div className="hm-role__head">
          <span className="hm-role__title">
            <Icon size={11} strokeWidth={2.5} />
            {meta.label}
          </span>
          <span className="hm-role__pct">{pct.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
