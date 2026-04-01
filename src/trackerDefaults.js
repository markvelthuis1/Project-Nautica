// steps: 0 = default, 1 = blue (in progress), 2 = orange (done)
export const mkSteps = () => [0, 0, 0, 0, 0, 0];

export const createInitialData = () => ({
  Architectuur: [
    { id: "arch-1", name: "Toetsen concept", steps: mkSteps(), substeps: [] },
    {
      id: "arch-2",
      name: "Auth. Layer",
      steps: mkSteps(),
      substeps: [
        { id: "arch-2-a", name: "Authentication", steps: mkSteps() },
        { id: "arch-2-b", name: "Authorization", steps: mkSteps() },
      ],
    },
    { id: "arch-3", name: "UI Layer", steps: mkSteps(), substeps: [] },
    {
      id: "arch-4",
      name: "Logic Layer",
      steps: mkSteps(),
      substeps: [
        { id: "arch-4-a", name: "Opdelen applicatie", steps: mkSteps() },
        { id: "arch-4-b", name: "Domein communicatie", steps: mkSteps() },
      ],
    },
    { id: "arch-5", name: "Database Layer", steps: mkSteps(), substeps: [] },
    { id: "arch-6", name: "(Web) Services", steps: mkSteps(), substeps: [] },
  ],
  Tooling: [
    { id: "tool-1", name: "DevOps", steps: mkSteps(), substeps: [] },
    { id: "tool-2", name: "Prototyping", steps: mkSteps(), substeps: [] },
    { id: "tool-3", name: "FrontEnd", steps: mkSteps(), substeps: [] },
    {
      id: "tool-4",
      name: "BackEnd",
      steps: mkSteps(),
      substeps: [{ id: "tool-4-a", name: "Codebase", steps: mkSteps() }],
    },
    { id: "tool-5", name: "Testing", steps: mkSteps(), substeps: [] },
    { id: "tool-6", name: "Deployment", steps: mkSteps(), substeps: [] },
  ],
});

export const defaultExpanded = { "arch-2": true };

export const createDefaultTrackerState = () => ({
  data: createInitialData(),
  expanded: defaultExpanded,
});
