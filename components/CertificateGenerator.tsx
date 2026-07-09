import React, { useState, useRef, useEffect } from 'react';
import { generateCertificateData, generateInvitationData } from '../services/gemini';

interface CertificateData {
  title: string;
  subtitle: string;
  recipientName: string;
  description: string;
  issuerName: string;
  organization: string;
  dateString: string;
  certificateNumber: string;
  primaryColor: string;
  secondaryColor: string;
  badgeType: string;
}

interface InvitationData {
  title: string;
  subtitle: string;
  hostName: string;
  description: string;
  recipientPlaceholder: string;
  dateString: string;
  location: string;
  extraDetails: string;
  primaryColor: string;
  secondaryColor: string;
  badgeType: string;
}

type Mode = 'CERTIFICATE' | 'INVITATION';

const THEMES = [
  { id: 'cosmic', label: 'Cosmic Nebula', bg: 'bg-slate-950 text-white', border: 'border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)]', desc: 'Dark theme with stars and cosmic neon glow.' },
  { id: 'royal', label: 'Royal Gold', bg: 'bg-[#FAF9F5] text-slate-900', border: 'border-[#D4AF37]/50 shadow-[0_0_30px_rgba(212,175,55,0.1)]', desc: 'Elegant cream background with double gold borders.' },
  { id: 'synthwave', label: 'Retro Synthwave', bg: 'bg-[#0f051d] text-pink-100', border: 'border-fuchsia-500/40 shadow-[0_0_40px_rgba(240,46,170,0.2)]', desc: '80s cyber theme with neon pink and grid elements.' },
  { id: 'emerald', label: 'Emerald Prestige', bg: 'bg-emerald-950 text-emerald-50', border: 'border-amber-400/30 shadow-[0_0_50px_rgba(16,185,129,0.15)]', desc: 'Deep emerald-green with metallic gold accents.' },
  { id: 'sunset', label: 'Pastel Sunset', bg: 'bg-gradient-to-br from-amber-50 via-rose-50 to-indigo-50 text-slate-800', border: 'border-rose-400/20 shadow-[0_0_30px_rgba(244,63,94,0.1)]', desc: 'Warm pastel blend with soft modern layouts.' }
];

const BADGES = {
  CERTIFICATE: [
    { id: 'star', label: 'Star', icon: 'fa-star' },
    { id: 'crown', label: 'Crown', icon: 'fa-crown' },
    { id: 'shield', label: 'Shield', icon: 'fa-shield-halved' },
    { id: 'globe', label: 'Globe', icon: 'fa-earth-americas' },
    { id: 'rocket', label: 'Rocket', icon: 'fa-rocket' }
  ],
  INVITATION: [
    { id: 'party', label: 'Party Popper', icon: 'fa-wand-magic-sparkles' },
    { id: 'cake', label: 'Cake', icon: 'fa-cake-candles' },
    { id: 'drinks', label: 'Cocktails', icon: 'fa-wine-glass' },
    { id: 'calendar', label: 'Calendar', icon: 'fa-calendar-days' },
    { id: 'gift', label: 'Gift Box', icon: 'fa-gift' }
  ]
};

export const CertificateGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Mode>('CERTIFICATE');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTheme, setActiveTheme] = useState('cosmic');

  // Certificate Specific State
  const [certificate, setCertificate] = useState<CertificateData | null>({
    title: 'CERTIFICATE OF ACHIEVEMENT',
    subtitle: 'Cosmic Intelligence Mastery Module',
    recipientName: 'QUANTINUM SPACEFARER',
    description: 'For outstanding performance in demonstrating computational alignment and mastery over neural networks and high-dimensional prompt frameworks within the Cosmic System.',
    issuerName: 'Captain Dhruva',
    organization: 'Quantinum Core Directorate',
    dateString: 'Stardate 2026.06',
    certificateNumber: 'Q-CERT-835-ALPHA',
    primaryColor: '#06b6d4',
    secondaryColor: '#ec4899',
    badgeType: 'star'
  });

  // Invitation Specific State
  const [invitation, setInvitation] = useState<InvitationData | null>({
    title: 'CELESTIAL RENDEZVOUS',
    subtitle: 'Quantum Horizon Invitation',
    hostName: 'The Cosmic Council',
    description: 'We request the honor of your presence at the event horizon of Sector 7-G to celebrate the arrival of the next generation neural singularity processor.',
    recipientPlaceholder: 'Honored Guest',
    dateString: 'Friday, July 17, 2026 at 20:00 UTC',
    location: 'The Neon Dome, Sector 7G',
    extraDetails: 'Dress Code: Cyber-Chic formal. Neural interfaces pre-synced.',
    primaryColor: '#8b5cf6',
    secondaryColor: '#f43f5e',
    badgeType: 'party'
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-generate some background effects when theme changes or data changes
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    try {
      if (activeTab === 'CERTIFICATE') {
        const data = await generateCertificateData(prompt);
        if (data) {
          setCertificate(data);
        }
      } else {
        const data = await generateInvitationData(prompt);
        if (data) {
          setInvitation(data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1500;
    const height = 1000;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw Background
    if (activeTheme === 'cosmic') {
      // Deep space gradient
      const grad = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, 900);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#020617');
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let i = 0; i < 80; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Cosmic Dust glows
      const primaryCol = activeTab === 'CERTIFICATE' ? certificate?.primaryColor || '#06b6d4' : invitation?.primaryColor || '#8b5cf6';
      const secondaryCol = activeTab === 'CERTIFICATE' ? certificate?.secondaryColor || '#ec4899' : invitation?.secondaryColor || '#f43f5e';
      
      ctx.globalAlpha = 0.12;
      const dust1 = ctx.createRadialGradient(200, 200, 10, 200, 200, 400);
      dust1.addColorStop(0, primaryCol);
      dust1.addColorStop(1, 'transparent');
      ctx.fillStyle = dust1;
      ctx.beginPath();
      ctx.arc(200, 200, 400, 0, Math.PI * 2);
      ctx.fill();

      const dust2 = ctx.createRadialGradient(width - 200, height - 200, 10, width - 200, height - 200, 400);
      dust2.addColorStop(0, secondaryCol);
      dust2.addColorStop(1, 'transparent');
      ctx.fillStyle = dust2;
      ctx.beginPath();
      ctx.arc(width - 200, height - 200, 400, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1.0;

      // Elegant cosmic border
      ctx.strokeStyle = primaryCol;
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      ctx.strokeStyle = secondaryCol;
      ctx.lineWidth = 1;
      ctx.strokeRect(52, 52, width - 104, height - 104);

      // Corner triangles
      ctx.fillStyle = primaryCol;
      ctx.beginPath();
      // TL
      ctx.moveTo(40, 40); ctx.lineTo(100, 40); ctx.lineTo(40, 100); ctx.closePath(); ctx.fill();
      // TR
      ctx.moveTo(width - 40, 40); ctx.lineTo(width - 100, 40); ctx.lineTo(width - 40, 100); ctx.closePath(); ctx.fill();
      // BL
      ctx.moveTo(40, height - 40); ctx.lineTo(100, height - 40); ctx.lineTo(40, height - 100); ctx.closePath(); ctx.fill();
      // BR
      ctx.moveTo(width - 40, height - 40); ctx.lineTo(width - 100, height - 40); ctx.lineTo(width - 40, height - 100); ctx.closePath(); ctx.fill();

    } else if (activeTheme === 'royal') {
      // Classic Parchment background
      ctx.fillStyle = '#FAF8F3';
      ctx.fillRect(0, 0, width, height);

      // Elegant Dual gold borders
      ctx.strokeStyle = '#D4AF37'; // Ornate Gold
      ctx.lineWidth = 6;
      ctx.strokeRect(45, 45, width - 90, height - 90);

      ctx.lineWidth = 2;
      ctx.strokeRect(58, 58, width - 116, height - 116);

      // Elegant Corner flourishes
      ctx.lineWidth = 3;
      const drawCornerFlourish = (cx: number, cy: number, rot: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.arc(20, 20, 20, Math.PI, Math.PI * 1.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(30, 30, 15, Math.PI, Math.PI * 1.5);
        ctx.stroke();
        ctx.restore();
      };
      drawCornerFlourish(58, 58, 0); // TL
      drawCornerFlourish(width - 58, 58, Math.PI / 2); // TR
      drawCornerFlourish(58, height - 58, -Math.PI / 2); // BL
      drawCornerFlourish(width - 58, height - 58, Math.PI); // BR

    } else if (activeTheme === 'synthwave') {
      // Neon Synth background
      ctx.fillStyle = '#0a0214';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.08)';
      ctx.lineWidth = 2;
      // Verticals
      for (let x = 100; x < width; x += 100) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      // Horizontals
      for (let y = 100; y < height; y += 100) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Glowing hot border
      ctx.strokeStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 5;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      ctx.strokeStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.strokeRect(52, 52, width - 104, height - 104);

      // Reset shadows
      ctx.shadowBlur = 0;

    } else if (activeTheme === 'emerald') {
      // Marble deep emerald gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#022c22');
      grad.addColorStop(0.5, '#064e3b');
      grad.addColorStop(1, '#022c22');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Gold metal lines
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.strokeRect(45, 45, width - 90, height - 90);

      ctx.lineWidth = 1;
      ctx.strokeStyle = '#fef08a';
      ctx.strokeRect(55, 55, width - 110, height - 110);

      // Inward corners
      ctx.beginPath();
      // TL
      ctx.moveTo(45, 120); ctx.lineTo(120, 45); ctx.stroke();
      // TR
      ctx.moveTo(width - 45, 120); ctx.lineTo(width - 120, 45); ctx.stroke();
      // BL
      ctx.moveTo(45, height - 120); ctx.lineTo(120, height - 45); ctx.stroke();
      // BR
      ctx.moveTo(width - 45, height - 120); ctx.lineTo(width - 120, height - 45); ctx.stroke();

    } else {
      // Sunset Gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#fff7ed');
      grad.addColorStop(0.5, '#fff1f2');
      grad.addColorStop(1, '#f5f3ff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Soft sunset borders
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 50, width - 100, height - 100);
    }

    // 2. Render Text
    if (activeTab === 'CERTIFICATE' && certificate) {
      const pColor = certificate.primaryColor || '#06b6d4';
      const isDark = activeTheme === 'cosmic' || activeTheme === 'synthwave' || activeTheme === 'emerald';
      
      // Title
      ctx.textAlign = 'center';
      ctx.fillStyle = activeTheme === 'royal' ? '#1e293b' : isDark ? '#ffffff' : '#0f172a';
      ctx.font = activeTheme === 'royal' ? 'bold 54px "Georgia", serif' : '900 56px "Inter", sans-serif';
      ctx.fillText(certificate.title.toUpperCase(), width / 2, 170);

      // Subtitle
      ctx.fillStyle = pColor;
      ctx.font = activeTheme === 'royal' ? 'italic italic 24px "Georgia", serif' : '900 20px "Inter", sans-serif';
      ctx.fillText(certificate.subtitle.toUpperCase(), width / 2, 230);

      // "Is hereby awarded to"
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(15, 23, 42, 0.6)';
      ctx.font = 'italic 20px "Georgia", serif';
      ctx.fillText('This certificate is proudly presented to', width / 2, 330);

      // Recipient Name
      ctx.fillStyle = activeTheme === 'royal' ? '#c2410c' : isDark ? '#ffffff' : '#1e1b4b';
      ctx.font = activeTheme === 'royal' ? 'italic 70px "Georgia", serif' : '900 64px "Inter", sans-serif';
      ctx.fillText(certificate.recipientName, width / 2, 420);

      // Line under Recipient Name
      ctx.strokeStyle = pColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 250, 450);
      ctx.lineTo(width / 2 + 250, 450);
      ctx.stroke();

      // Description text wrapping helper
      const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const wordsList = text.split(' ');
        let line = '';
        let currentY = y;
        
        ctx.font = '20px "Georgia", serif';
        for (let n = 0; n < wordsList.length; n++) {
          const testLine = line + wordsList[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = wordsList[n] + ' ';
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, currentY);
      };

      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.85)' : '#334155';
      wrapText(certificate.description, width / 2, 530, 950, 36);

      // Left Signature Block
      ctx.textAlign = 'left';
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : '#1e293b';
      ctx.font = 'bold 22px "Georgia", serif';
      ctx.fillText(certificate.issuerName, 180, 780);
      
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(180, 800); ctx.lineTo(430, 800); ctx.stroke();
      
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b';
      ctx.font = 'bold 15px "Inter", sans-serif';
      ctx.fillText('AUTHORIZED ISSUER', 180, 825);
      ctx.font = '13px "Inter", sans-serif';
      ctx.fillText(certificate.organization.toUpperCase(), 180, 845);

      // Right Date Block
      ctx.textAlign = 'right';
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : '#1e293b';
      ctx.font = 'bold 22px "Georgia", serif';
      ctx.fillText(certificate.dateString, width - 180, 780);
      
      ctx.beginPath(); ctx.moveTo(width - 180, 800); ctx.lineTo(width - 430, 800); ctx.stroke();
      
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b';
      ctx.font = 'bold 15px "Inter", sans-serif';
      ctx.fillText('DATE OF VALIDATION', width - 430, 825);
      ctx.font = '13px "Inter", sans-serif';
      ctx.fillText(`SERIAL: ${certificate.certificateNumber}`, width - 430, 845);

      // Draw Central Badge/Seal
      ctx.textAlign = 'center';
      const badgeX = width / 2;
      const badgeY = 780;

      // Outer gold circle
      const badgeGrad = ctx.createRadialGradient(badgeX, badgeY, 10, badgeX, badgeY, 55);
      badgeGrad.addColorStop(0, '#fef08a');
      badgeGrad.addColorStop(0.8, '#fbbf24');
      badgeGrad.addColorStop(1, '#b45309');
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = badgeGrad;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner ornate ring
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, 42, 0, Math.PI * 2);
      ctx.stroke();

      // Ribbon details
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      // Left ribbon
      ctx.moveTo(badgeX - 35, badgeY + 30);
      ctx.lineTo(badgeX - 55, badgeY + 110);
      ctx.lineTo(badgeX - 35, badgeY + 100);
      ctx.lineTo(badgeX - 15, badgeY + 110);
      ctx.closePath();
      ctx.fill();

      // Right ribbon
      ctx.beginPath();
      ctx.moveTo(badgeX + 15, badgeY + 110);
      ctx.lineTo(badgeX + 35, badgeY + 100);
      ctx.lineTo(badgeX + 55, badgeY + 110);
      ctx.lineTo(badgeX + 35, badgeY + 30);
      ctx.closePath();
      ctx.fill();

      // Draw Badge Icon in center of seal
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 36px "Font Awesome 6 Free", "Font Awesome 5 Free", "serif"';
      let iconUnicode = '★'; // Default star
      if (certificate.badgeType === 'crown') iconUnicode = '👑';
      else if (certificate.badgeType === 'shield') iconUnicode = '🛡️';
      else if (certificate.badgeType === 'globe') iconUnicode = '🌐';
      else if (certificate.badgeType === 'rocket') iconUnicode = '🚀';
      else if (certificate.badgeType === 'comet') iconUnicode = '☄️';

      ctx.fillText(iconUnicode, badgeX, badgeY + 12);

    } else if (activeTab === 'INVITATION' && invitation) {
      const pColor = invitation.primaryColor || '#8b5cf6';
      const isDark = activeTheme === 'cosmic' || activeTheme === 'synthwave' || activeTheme === 'emerald';
      
      // Title
      ctx.textAlign = 'center';
      ctx.fillStyle = activeTheme === 'royal' ? '#1e293b' : isDark ? '#ffffff' : '#0f172a';
      ctx.font = activeTheme === 'royal' ? 'bold 54px "Georgia", serif' : '900 58px "Inter", sans-serif';
      ctx.fillText(invitation.title.toUpperCase(), width / 2, 180);

      // Subtitle
      ctx.fillStyle = pColor;
      ctx.font = activeTheme === 'royal' ? 'italic italic 24px "Georgia", serif' : '900 20px "Inter", sans-serif';
      ctx.fillText(invitation.subtitle.toUpperCase(), width / 2, 240);

      // Ornate separator
      ctx.strokeStyle = pColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 120, 280);
      ctx.lineTo(width / 2 + 120, 280);
      ctx.stroke();

      // Invitation statement
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.7)' : '#475569';
      ctx.font = 'italic 20px "Georgia", serif';
      ctx.fillText(`You are cordially invited to join us for a cosmic event, hosted by`, width / 2, 340);

      // Host Name
      ctx.fillStyle = activeTheme === 'royal' ? '#1e293b' : isDark ? '#ffffff' : '#0f172a';
      ctx.font = '900 32px "Inter", sans-serif';
      ctx.fillText(invitation.hostName.toUpperCase(), width / 2, 390);

      // Wrap Description text
      const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const wordsList = text.split(' ');
        let line = '';
        let currentY = y;
        
        ctx.font = '21px "Georgia", serif';
        for (let n = 0; n < wordsList.length; n++) {
          const testLine = line + wordsList[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = wordsList[n] + ' ';
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, currentY);
      };

      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : '#334155';
      wrapText(invitation.description, width / 2, 470, 900, 36);

      // Venue / Coordinates Panel
      const cardY = 620;
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)';
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1.5;
      
      // Rounded panel block
      const drawRoundedRect = (rx: number, ry: number, rw: number, rh: number, radius: number) => {
        ctx.beginPath();
        ctx.moveTo(rx + radius, ry);
        ctx.lineTo(rx + rw - radius, ry);
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
        ctx.lineTo(rx + rw, ry + rh - radius);
        ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
        ctx.lineTo(rx + radius, ry + rh);
        ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
        ctx.lineTo(rx, ry + radius);
        ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      drawRoundedRect(220, cardY, 1060, 160, 20);

      // Event Details
      ctx.textAlign = 'center';
      
      // Date and Time
      ctx.fillStyle = pColor;
      ctx.font = 'bold 18px "Inter", sans-serif';
      ctx.fillText('TIMESTAMP / SCHEDULE', width / 2, cardY + 35);
      ctx.fillStyle = isDark ? '#ffffff' : '#1e293b';
      ctx.font = 'bold 22px "Inter", sans-serif';
      ctx.fillText(invitation.dateString, width / 2, cardY + 68);

      // Venue Location
      ctx.fillStyle = pColor;
      ctx.font = 'bold 18px "Inter", sans-serif';
      ctx.fillText('LOCATION / SECTOR COORDINATES', width / 2, cardY + 115);
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : '#475569';
      ctx.font = 'semibold 21px "Inter", sans-serif';
      ctx.fillText(invitation.location, width / 2, cardY + 145);

      // Extra Details
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b';
      ctx.font = 'italic 16px "Georgia", serif';
      ctx.fillText(`Important Parameters: ${invitation.extraDetails}`, width / 2, cardY + 225);

      // Bottom Right Indicator
      ctx.textAlign = 'right';
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
      ctx.font = 'bold 12px "Inter", sans-serif';
      ctx.fillText('SECURED TRANSMISSION // QUANTINUM CORE', width - 220, cardY + 265);

      // Bottom Left Invitee
      ctx.textAlign = 'left';
      ctx.fillText(`INVITEE CATEGORY: ${invitation.recipientPlaceholder.toUpperCase()}`, 220, cardY + 265);
    }
  };

  useEffect(() => {
    drawCanvas();
  }, [activeTheme, activeTab, certificate, invitation]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const title = activeTab === 'CERTIFICATE' ? certificate?.title || 'Certificate' : invitation?.title || 'Invitation';
    link.download = `${title.replace(/\s+/g, '_')}.png`;
    link.href = image;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const currentTheme = THEMES.find(t => t.id === activeTheme) || THEMES[0];

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 bg-black/40 font-sans overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto w-full space-y-8 pb-12">
        
        {/* Title Block */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Cosmic Certificate Suite
          </h1>
          <p className="text-white/40 font-mono text-[10px] uppercase tracking-[0.6em]">
            Autonomous Decorative Award & Invitation Synthesizer
          </p>
        </div>

        {/* Tab & Creator Selector */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
            <button
              onClick={() => setActiveTab('CERTIFICATE')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'CERTIFICATE'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <i className="fas fa-certificate mr-2"></i>
              Certificate Gen
            </button>
            <button
              onClick={() => setActiveTab('INVITATION')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'INVITATION'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <i className="fas fa-envelope-open-text mr-2"></i>
              Invitation Gen
            </button>
          </div>

          <p className="text-xs font-mono text-white/50 bg-white/5 px-4 py-2 rounded-full border border-white/5 text-center">
            {activeTab === 'CERTIFICATE' 
              ? 'Enter a certification topic to generate highly stylized award texts.' 
              : 'Enter any event details to generate fully tailored greetings & RSVPs.'}
          </p>
        </div>

        {/* Gemini Input Synthesis Panel */}
        <form onSubmit={handleGenerate} className="relative group max-w-3xl mx-auto w-full">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
          <div className="relative flex flex-col md:flex-row items-stretch gap-4 bg-white/5 border border-white/10 p-3 rounded-3xl backdrop-blur-3xl">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={activeTab === 'CERTIFICATE' 
                ? "Enter Certificate Topic (e.g., Quantum Coding Champion, Best Pizza Chef, Stellar Co-pilot)..." 
                : "Enter Event/Invitation Topic (e.g., Cyberpunk Birthday Party, Deep Research Symposium, Neon Wedding)..."}
              className="flex-1 bg-transparent px-5 py-4 text-white text-sm outline-none placeholder:text-white/20 font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className={`px-8 py-4 bg-gradient-to-r ${
                activeTab === 'CERTIFICATE' ? 'from-cyan-500 to-blue-600' : 'from-purple-500 to-pink-600'
              } text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center`}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-atom fa-spin mr-2 text-sm"></i>
                  Synthesizing Core...
                </>
              ) : (
                <>
                  <i className="fas fa-wand-magic-sparkles mr-2"></i>
                  AI Synthesize
                </>
              )}
            </button>
          </div>
        </form>

        {/* Master Workspace: Editor & Live Render */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Settings, Presets, Form Inputs */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Theme Preset Card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-3xl space-y-4">
              <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-gradient">
                <i className="fas fa-palette mr-1.5"></i> Theme Preset
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setActiveTheme(theme.id)}
                    className={`text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                      activeTheme === theme.id
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-wider">{theme.label}</h4>
                      <p className="text-[9px] font-mono mt-0.5 opacity-80 leading-snug">{theme.desc}</p>
                    </div>
                    {activeTheme === theme.id && (
                      <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center text-white text-[9px]">
                        <i className="fas fa-check"></i>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Badge Selection Card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-3xl space-y-4">
              <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-gradient">
                <i className="fas fa-award mr-1.5"></i> Decorative Badge/Seal
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {BADGES[activeTab].map(badge => {
                  const currentBadge = activeTab === 'CERTIFICATE' ? certificate?.badgeType : invitation?.badgeType;
                  const isSelected = currentBadge === badge.id;
                  return (
                    <button
                      key={badge.id}
                      onClick={() => {
                        if (activeTab === 'CERTIFICATE' && certificate) {
                          setCertificate({ ...certificate, badgeType: badge.id });
                        } else if (activeTab === 'INVITATION' && invitation) {
                          setInvitation({ ...invitation, badgeType: badge.id });
                        }
                      }}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      <i className={`fas ${badge.icon} text-lg`}></i>
                      <span className="text-[8px] font-black uppercase tracking-widest">{badge.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Field Editing Form */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-3xl space-y-4 font-mono">
              <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-gradient">
                <i className="fas fa-pen-to-square mr-1.5"></i> Interactive Editor
              </h3>
              
              {activeTab === 'CERTIFICATE' && certificate ? (
                <div className="space-y-3.5 text-xs text-white/70">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-white/30 font-black">Title</label>
                    <input
                      type="text"
                      value={certificate.title}
                      onChange={(e) => setCertificate({ ...certificate, title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-white/30 font-black">Subtitle</label>
                    <input
                      type="text"
                      value={certificate.subtitle}
                      onChange={(e) => setCertificate({ ...certificate, subtitle: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-white/30 font-black">Recipient Name</label>
                    <input
                      type="text"
                      value={certificate.recipientName}
                      onChange={(e) => setCertificate({ ...certificate, recipientName: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500/40 font-sans font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-white/30 font-black">Honorary Statement</label>
                    <textarea
                      value={certificate.description}
                      onChange={(e) => setCertificate({ ...certificate, description: e.target.value })}
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500/40 text-xs font-sans leading-relaxed"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-white/30 font-black">Authorized Issuer</label>
                      <input
                        type="text"
                        value={certificate.issuerName}
                        onChange={(e) => setCertificate({ ...certificate, issuerName: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500/40 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-white/30 font-black">Organization</label>
                      <input
                        type="text"
                        value={certificate.organization}
                        onChange={(e) => setCertificate({ ...certificate, organization: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500/40 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-white/30 font-black">Validation Date</label>
                      <input
                        type="text"
                        value={certificate.dateString}
                        onChange={(e) => setCertificate({ ...certificate, dateString: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500/40 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-white/30 font-black">Certificate Code</label>
                      <input
                        type="text"
                        value={certificate.certificateNumber}
                        onChange={(e) => setCertificate({ ...certificate, certificateNumber: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500/40 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-white/30 font-black">Primary Color</label>
                      <input
                        type="color"
                        value={certificate.primaryColor}
                        onChange={(e) => setCertificate({ ...certificate, primaryColor: e.target.value })}
                        className="w-full h-8 bg-transparent cursor-pointer rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-white/30 font-black">Secondary Color</label>
                      <input
                        type="color"
                        value={certificate.secondaryColor}
                        onChange={(e) => setCertificate({ ...certificate, secondaryColor: e.target.value })}
                        className="w-full h-8 bg-transparent cursor-pointer rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              ) : invitation ? (
                <div className="space-y-3.5 text-xs text-white/70">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-white/30 font-black">Title</label>
                    <input
                      type="text"
                      value={invitation.title}
                      onChange={(e) => setInvitation({ ...invitation, title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-white/30 font-black">Subtitle</label>
                    <input
                      type="text"
                      value={invitation.subtitle}
                      onChange={(e) => setInvitation({ ...invitation, subtitle: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-white/30 font-black">Host / Organizer</label>
                    <input
                      type="text"
                      value={invitation.hostName}
                      onChange={(e) => setInvitation({ ...invitation, hostName: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-white/30 font-black">Invitation Description</label>
                    <textarea
                      value={invitation.description}
                      onChange={(e) => setInvitation({ ...invitation, description: e.target.value })}
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500/40 text-xs font-sans leading-relaxed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-white/30 font-black">Scheduled Timestamp</label>
                    <input
                      type="text"
                      value={invitation.dateString}
                      onChange={(e) => setInvitation({ ...invitation, dateString: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500/40 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-white/30 font-black">Venue Location</label>
                    <input
                      type="text"
                      value={invitation.location}
                      onChange={(e) => setInvitation({ ...invitation, location: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500/40 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-white/30 font-black">Invite Category</label>
                    <input
                      type="text"
                      value={invitation.recipientPlaceholder}
                      onChange={(e) => setInvitation({ ...invitation, recipientPlaceholder: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500/40 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase text-white/30 font-black">Extra Parameters (RSVP, Dress Code)</label>
                    <input
                      type="text"
                      value={invitation.extraDetails}
                      onChange={(e) => setInvitation({ ...invitation, extraDetails: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500/40 text-xs font-sans"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-white/30 font-black">Primary Color</label>
                      <input
                        type="color"
                        value={invitation.primaryColor}
                        onChange={(e) => setInvitation({ ...invitation, primaryColor: e.target.value })}
                        className="w-full h-8 bg-transparent cursor-pointer rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-white/30 font-black">Secondary Color</label>
                      <input
                        type="color"
                        value={invitation.secondaryColor}
                        onChange={(e) => setInvitation({ ...invitation, secondaryColor: e.target.value })}
                        className="w-full h-8 bg-transparent cursor-pointer rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Panel: Beautiful Live Preview + Exporter buttons */}
          <div className="lg:col-span-8 flex flex-col items-center gap-6">
            
            {/* Live Canvas Canvas Holder - responsive wrapper */}
            <div className="w-full bg-slate-950/60 border border-white/10 rounded-[2.5rem] p-4 md:p-8 flex flex-col items-center justify-center relative shadow-[0_0_80px_rgba(0,0,0,0.6)] backdrop-blur-3xl overflow-hidden group">
              
              <div className="absolute top-4 left-6 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/40">Synthesizer Active PREVIEW</span>
              </div>

              {/* Aspect Ratio Canvas Container */}
              <div className="w-full aspect-[3/2] rounded-2xl overflow-hidden shadow-2xl relative border border-white/10 max-h-[580px] flex items-center justify-center">
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-full object-contain pointer-events-auto"
                />
              </div>

              {/* Info text */}
              <p className="mt-4 text-[9px] font-mono text-white/30 uppercase tracking-widest text-center">
                Canvas dimensions: 1500 x 1000 High-Res // Powered by QUANTINUM-Q Rendering engine
              </p>
            </div>

            {/* Print/Download Action Buttons */}
            <div className="flex flex-wrap gap-4 items-center justify-center">
              <button
                onClick={handleDownload}
                className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-[1.03] active:scale-95 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl transition-all flex items-center gap-3"
              >
                <i className="fas fa-file-arrow-down text-sm"></i>
                Download High-Res PNG
              </button>
              <button
                onClick={handlePrint}
                className="px-8 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all flex items-center gap-3"
              >
                <i className="fas fa-print text-sm"></i>
                Print Certificate / RSVP
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
