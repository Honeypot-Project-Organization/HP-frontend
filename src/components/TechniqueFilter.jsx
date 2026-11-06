import Select from "./Select.jsx";
import { useCatalog } from "../hooks/useCatalog.js";

/** "Any technique" + every technique the rules can produce. value "" = no filter. */
export default function TechniqueFilter({ value, onChange }) {
  const { list } = useCatalog();
  const options = [{ value: "", label: "any technique" }, ...list.map((c) => ({ value: c.id, label: `${c.id} ${c.name || ""}`.trim() }))];
  return <Select label="Filter by MITRE technique" value={value} onChange={onChange} options={options} width={176} menuWidth={380} />;
}
