import type { OutlineNode } from "@/lib/settings/settings-tabs-config";

export function OutlineTree({
  nodes,
  depth = 0,
}: {
  nodes: OutlineNode[];
  depth?: number;
}) {
  return (
    <ul
      className={
        depth === 0
          ? "space-y-3"
          : "mt-2 space-y-2 border-l border-[#E5E7EB] pl-4"
      }
    >
      {nodes.map((node, i) => (
        <li key={`${depth}-${i}`}>
          <p className="text-sm leading-snug text-[#374151]">{node.label}</p>
          {node.children && node.children.length > 0 ? (
            <OutlineTree nodes={node.children} depth={depth + 1} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
