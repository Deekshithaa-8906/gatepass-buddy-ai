import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { OutingRequest } from '@/types';
import { getUserProfilePhoto } from '@/lib/storage';

export async function generateGatepassPDF(request: OutingRequest, profilePhoto?: string): Promise<jsPDF> {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const passLabel = request.type === 'leave' ? 'Official Leave Pass' : 'Official Gatepass';

  // Header
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, w, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PassNTrack', w / 2, 18, { align: 'center' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text(`PassNTrack – ${passLabel}`, w / 2, 32, { align: 'center' });

  // Profile photo (top-right, below header)
  if (profilePhoto) {
    try {
      doc.addImage(profilePhoto, 'JPEG', w - 45, 50, 25, 25);
    } catch { /* ignore if image fails */ }
  }

  // Body
  doc.setTextColor(30, 30, 30);
  let y = 58;
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

  // Approval chain
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(left, y, w - left, y);
  y += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Approval Chain:', left, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  for (const step of request.approvalChain) {
    const stepLabel = `${step.role.toUpperCase()}: ${step.status.toUpperCase()}${step.approvedBy ? ` (by ${step.approvedBy})` : ''}${step.timestamp ? ` — ${new Date(step.timestamp).toLocaleString()}` : ''}`;
    doc.text(stepLabel, left + 5, y);
    y += 7;
  }

  y += 5;
  doc.line(left, y, w - left, y);
  y += 12;

  // Status
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 139, 34);
  doc.text('STATUS: APPROVED', w / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleString()} by PassNTrack`, w / 2, y, { align: 'center' });

  // QR Code (bottom-right)
  const qrData = JSON.stringify({
    id: request.id,
    name: request.name,
    regNumber: request.regNumber,
    institution: request.institution,
    roomNumber: request.roomNumber,
    outDateTime: request.outDateTime,
    inDateTime: request.inDateTime,
    status: request.status,
    verifyUrl: `${window.location.origin}/verify/${request.id}`,
  });

  try {
    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 200, margin: 1 });
    const qrSize = 40;
    const qrX = w - qrSize - 15;
    const qrY = doc.internal.pageSize.getHeight() - qrSize - 25;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Scan to verify', qrX + qrSize / 2, qrY + qrSize + 4, { align: 'center' });
  } catch { /* QR generation failed silently */ }

  // Footer
  doc.setFillColor(30, 58, 95);
  doc.rect(0, doc.internal.pageSize.getHeight() - 15, w, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('© PassNTrack – Hostel Gatepass Management System', w / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });

  return doc;
}

export async function downloadGatepassPDF(request: OutingRequest) {
  const profilePhoto = getUserProfilePhoto(request.studentId);
  const doc = await generateGatepassPDF(request, profilePhoto);
  const prefix = request.type === 'leave' ? 'leavepass' : 'gatepass';
  doc.save(`${prefix}-${request.id.slice(0, 8)}.pdf`);
}
