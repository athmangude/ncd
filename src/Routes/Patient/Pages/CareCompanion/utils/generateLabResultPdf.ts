export interface LabResultMetric {
  name: string
  value: number
  unit: string
  referenceRange: string
  status: "NORMAL" | "LOW" | "HIGH" | "CRITICAL"
}

export async function generateLabResultPdf(
  metrics: LabResultMetric[],
  labName: string,
  date: string,
  patientName: string,
  testName: string,
) {
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text(labName, 20, 20)
  doc.setFontSize(10)
  doc.text(`Date: ${date}`, 20, 28)
  doc.text(`Patient: ${patientName}`, 20, 34)
  doc.text(`Test: ${testName}`, 20, 40)

  autoTable(doc, {
    startY: 50,
    head: [["Metric", "Result", "Unit", "Reference Range", "Status"]],
    body: metrics.map((m) => [
      m.name,
      String(m.value),
      m.unit,
      m.referenceRange,
      m.status,
    ]),
    didParseCell: ((data: {
      column: { index: number }
      section: string
      cell: { raw: unknown; styles: { textColor: number[] } }
    }) => {
      if (data.column.index === 4 && data.section === "body") {
        const status = data.cell.raw as string
        data.cell.styles.textColor =
          status === "NORMAL"
            ? [34, 139, 34]
            : status === "LOW"
              ? [204, 163, 0]
              : status === "HIGH"
                ? [255, 140, 0]
                : [220, 20, 60]
      }
    }) as any,
  })

  doc.save(`${testName.replace(/\s+/g, "-").toLowerCase()}-results.pdf`)
}
