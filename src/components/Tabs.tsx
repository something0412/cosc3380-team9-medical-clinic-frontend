import { useState } from "react";
import type { ReactNode } from "react";

// One tab: the label shown on its button, and the content to render while
// it's active. `content` is just a React node, so each tab can hold
// anything (a table, a placeholder, a button) without Tabs needing to
// know what's inside.
export interface TabDefinition {
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabDefinition[];
}

// Generic, reusable tab bar: a row of buttons plus the active tab's
// content below it. It knows nothing about patients/appointments/etc.,
// which is what makes it reusable — copy this component as-is for future
// UI, and define new tabs by passing a different `tabs` array in, not by
// editing this file.
export function Tabs({ tabs }: TabsProps) {
  // Track the active tab by index rather than by the tab object itself —
  // simpler to compare and update than object/label equality.
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <div className="tab-bar">
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            type="button"
            className={index === activeIndex ? "tab-button tab-button-active" : "tab-button"}
            onClick={() => setActiveIndex(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content">{tabs[activeIndex].content}</div>
    </div>
  );
}
