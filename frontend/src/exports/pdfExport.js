import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportResultsToPDF = (results) => {
  // Set orientation to landscape
  const doc = new jsPDF("landscape"); // 'landscape' or 'portrait'

  // Add title
  doc.setFontSize(18);
  doc.text("Checked Claims Report", 14, 22); // Updated title

  // Prepare table data with properly formatted sources
  const tableData = [];

  results.facts.forEach((fact) => {
    // Format sources as a single string with line breaks
    let sourcesText = "";
    if (fact.sources && fact.sources.length > 0) {
      sourcesText = fact.sources
        .map((source, idx) => {
          // Display title and URL if available, otherwise just the source string
          const sourceTitle = source.title || source;
          const sourceUrl = source.url && source.url.startsWith("http") ? ` (${source.url})` : '';
          return `${idx + 1}. ${sourceTitle}${sourceUrl}`;
        })
        .join("\n"); // Each source on a new line
    } else {
      sourcesText = "No sources available";
    }

    // Add main fact row with all information (excluding confidence)
    tableData.push([
      `Claim: ${fact.claim}`, // Formatted Claim
      `Status: ${fact.status?.toUpperCase() || 'N/A'}`, // Formatted Status
      `Explanation: ${fact.explanation || 'No explanation provided.'}`, // Formatted Explanation
      sourcesText, // Sources on separate lines
    ]);
  });

  // Add table of results
  autoTable(doc, {
    head: [["Claim", "Status", "Explanation", "Sources"]], // Removed "Confidence" column
    body: tableData,
    startY: 30,
    styles: {
      cellPadding: 4,
      fontSize: 8,
      overflow: "linebreak",
      cellWidth: "wrap",
      valign: "top",
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [52, 73, 94], // Dark blue header
      textColor: 255, // White text
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240], // Light gray for alternate rows
    },
    columnStyles: {
      0: { cellWidth: 50 }, // Claim
      1: { cellWidth: 20 }, // Status
      2: { cellWidth: 90 }, // Explanation
      3: { cellWidth: 80 }, // Sources
    },
  });

  // Save the PDF
  doc.save("checked-claims-report.pdf"); // Updated filename
};