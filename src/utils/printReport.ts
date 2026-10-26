// opens the print window for the report on the page (components/PrintReport.tsx), where "Save as PDF" downloads it
export function printReport(fileName: string) {
  // the pdf file is named after the page title
  const pageTitle = document.title;
  document.title = fileName;
  window.addEventListener("afterprint", () => (document.title = pageTitle), { once: true });
  window.print();
}
