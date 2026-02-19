import jsPDF from 'jspdf';
import { OutingRequest } from '@/types';

export function generateGatepassPDF(request: OutingRequest): jsPDF {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, w, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SNS Institutions', w / 2, 18, { align: 'center' });
  doc.setFontSize(14);
  doc.text('Hostel Gatepass', w / 2, 30, { align: 'center' });

  // Body
  doc.setTextColor(30, 30, 30);
  let y = 55;
  const left = 20;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${request.type.toUpperCase()} PASS`, w / 2, y, { align: 'center' });
  y += 15;

  doc.setDrawColor(200, 200, 200);
  doc.line(left, y, w - left, y);
  y += 10;

  const fields = [
    ['Name', request.name],
    ['Registration No', request.regNumber],
    ['Year', request.year],
    ['Branch', request.branch],
    ['Institution', request.institution],
    ['Room Number', request.roomNumber],
    ['Student Phone', request.studentPhone],
    ['Parent Phone', request.parentPhone],
    ['Out Date & Time', new Date(request.outDateTime).toLocaleString()],
    ['In Date & Time', new Date(request.inDateTime).toLocaleString()],
    ['Reason', request.reason],
  ];

  doc.setFontSize(11);
  for (const [label, value] of fields) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, left, y);
    doc.setFont('helvetica', 'normal');
    const labelWidth = doc.getTextWidth(`${label}: `);
    const lines = doc.splitTextToSize(value, w - left - labelWidth - 20);
    doc.text(lines, left + labelWidth + 2, y);
    y += lines.length * 6 + 4;
  }

  y += 5;
  doc.line(left, y, w - left, y);
  y += 12;

  // Approval Status
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 139, 34);
  doc.text('STATUS: APPROVED', w / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleString()}`, w / 2, y, { align: 'center' });

  // Footer
  doc.setFillColor(30, 58, 95);
  doc.rect(0, doc.internal.pageSize.getHeight() - 15, w, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('© SNS Institutions - Hostel Gatepass Management System', w / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });

  return doc;
}

export function downloadGatepassPDF(request: OutingRequest) {
  const doc = generateGatepassPDF(request);
  doc.save(`gatepass-${request.id.slice(0, 8)}.pdf`);
}
