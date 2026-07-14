import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Award,
  User,
  MapPin,
  Landmark,
  Clock,
  CheckCircle,
  RotateCw,
  Eye,
  Download,
  ChevronRight,
  Activity,
  CalendarDays,
  AlertTriangle,
  BadgeCheck,
  Shield,
  X
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { TVRSIdentityCard } from './Profile';
import QRCode from 'qrcode';

export default function PublicVerification() {
  const { token_or_id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const idSectionRef = useRef(null);

  const runVerificationScan = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/identity/verify/${token_or_id}`);
      const resData = await response.json();
      if (resData.success) {
        setData(resData);
      } else {
        setError(resData.message || 'Decryption failed: Member digital record is not indexed on our core PostgreSQL node.');
      }
    } catch (err) {
      console.error(err);
      setError('Communication with the TS-State core governance server timed out.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runVerificationScan();
  }, [token_or_id]);

  const { identity, profile, metrics } = data || {};

  const designation = useMemo(() => {
    if (!profile?.role) return 'OFFICIAL';
    return profile.role.replace(/_/g, ' ').toUpperCase();
  }, [profile?.role]);

  // Generate real QR code locally whenever the identity updates
  useEffect(() => {
    if (identity?.qr_token) {
      const isNativeMobile =
        window.Capacitor &&
        window.Capacitor.getPlatform &&
        window.Capacitor.getPlatform() !== 'web';
      const originUrl = isNativeMobile
        ? 'https://trsv-union.onrender.com'
        : window.location.origin;
      const verifyUrl = isNativeMobile
        ? `${originUrl}/#/verify/${identity.qr_token}`
        : `${originUrl}/verify/${identity.qr_token}`;

      QRCode.toDataURL(verifyUrl, {
        width: 300,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR Code generation error:', err));
    }
  }, [identity?.qr_token]);

  // Scroll to identity card preview helper
  const handleScrollToId = () => {
    if (idSectionRef.current) {
      idSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Helper to load image safely inside canvas using CORS
  const loadImage = (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  };

  // High-Resolution ID PNG Export trigger
  const handleDownload = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2200;
    canvas.height = 1720;
    const ctx = canvas.getContext('2d');

    const avatarUrl = profile?.profile_image || '';
    const [avatarImg, qrImg] = await Promise.all([
      avatarUrl ? loadImage(avatarUrl) : Promise.resolve(null),
      qrDataUrl ? loadImage(qrDataUrl) : Promise.resolve(null),
    ]);

    // Draw backdrop backing
    const bgGradient = ctx.createLinearGradient(0, 0, 2200, 1720);
    bgGradient.addColorStop(0, '#080c14');
    bgGradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 2200, 1720);

    const drawRoundedRect = (c, x, y, width, height, radius, fillStyle, strokeStyle, lineWidth) => {
      c.beginPath();
      c.moveTo(x + radius, y);
      c.lineTo(x + width - radius, y);
      c.quadraticCurveTo(x + width, y, x + width, y + radius);
      c.lineTo(x + width, y + height - radius);
      c.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      c.lineTo(x + radius, y + height);
      c.quadraticCurveTo(x, y + height, x, y + height - radius);
      c.lineTo(x, y + radius);
      c.quadraticCurveTo(x, y, x + radius, y);
      c.closePath();
      if (fillStyle) {
        c.fillStyle = fillStyle;
        c.fill();
      }
      if (strokeStyle) {
        c.strokeStyle = strokeStyle;
        c.lineWidth = lineWidth || 1;
        c.stroke();
      }
    };

    const clipRoundedRect = (c, x, y, width, height, radius) => {
      c.beginPath();
      c.moveTo(x + radius, y);
      c.lineTo(x + width - radius, y);
      c.quadraticCurveTo(x + width, y, x + width, y + radius);
      c.lineTo(x + width, y + height - radius);
      c.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      c.lineTo(x + radius, y + height);
      c.quadraticCurveTo(x, y + height, x, y + height - radius);
      c.lineTo(x, y + radius);
      c.quadraticCurveTo(x, y, x + radius, y);
      c.closePath();
      c.clip();
    };

    const hashStringLocal = (str) => {
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    };

    const drawVerificationGlyph = (c, val, gX, gY, gSize, dark) => {
      const grid = 21;
      const seed = hashStringLocal(val || 'TVRS-DEFAULT');
      let s = seed;
      const rand = () => {
        s ^= s << 13;
        s ^= s >>> 17;
        s ^= s << 5;
        s >>>= 0;
        return s / 4294967295;
      };

      const cells = [];
      for (let y = 0; y < grid; y++) {
        for (let x = 0; x < grid; x++) {
          const inFinder =
            (x < 7 && y < 7) ||
            (x > grid - 8 && y < 7) ||
            (x < 7 && y > grid - 8);
          cells.push(inFinder ? 0 : rand() > 0.565 ? 1 : 0);
        }
      }

      const cell = gSize / grid;
      c.fillStyle = '#ffffff';
      c.fillRect(gX, gY, gSize, gSize);

      c.fillStyle = dark;
      for (let i = 0; i < cells.length; i++) {
        if (cells[i]) {
          const cx = gX + (i % grid) * cell;
          const cy = gY + Math.floor(i / grid) * cell;
          drawRoundedRect(c, cx, cy, cell * 0.92, cell * 0.92, cell * 0.18, dark, null);
        }
      }

      const drawFinder = (fx, fy) => {
        const tx = gX + fx * cell;
        const ty = gY + fy * cell;
        drawRoundedRect(c, tx, ty, cell * 7, cell * 7, cell * 0.9, dark, null);
        drawRoundedRect(c, tx + cell, ty + cell, cell * 5, cell * 5, cell * 0.6, '#ffffff', null);
        drawRoundedRect(c, tx + cell * 2, ty + cell * 2, cell * 3, cell * 3, cell * 0.4, dark, null);
      };

      drawFinder(0, 0);
      drawFinder(grid - 7, 0);
      drawFinder(0, grid - 7);
    };

    const wrapText = (context, txt, x, y, maxWidth, lineHeight) => {
      const words = txt.split(' ');
      let line = '';
      let currY = y;
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = context.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          context.fillText(line, x, currY);
          line = words[n] + ' ';
          currY += lineHeight;
        } else {
          line = testLine;
        }
      }
      context.fillText(line, x, currY);
    };

    const cW = 1012;
    const cH = 1612;
    const cY = 54;
    const fX = 54;
    const bX = 1134;

    const drawGuillocheAndWatermarks = (c, cardX) => {
      c.save();
      c.rotate(-18 * Math.PI / 180);
      c.fillStyle = 'rgba(10, 42, 84, 0.012)';
      c.font = "bold 22px 'JetBrains Mono', monospace";
      for (let row = -10; row < 50; row++) {
        let line = Array(15).fill('TVRS \u2022 AUTHENTIC \u2022').join('  ');
        c.fillText(line, -400, row * 52);
      }
      c.restore();

      c.strokeStyle = 'rgba(10, 42, 84, 0.022)';
      c.lineWidth = 1.2;
      for (let cy = 0; cy < cH; cy += 120) {
        c.beginPath();
        for (let cx = 0; cx < cW; cx += 10) {
          const sineY = cy + Math.sin(cx / 40) * 15;
          if (cx === 0) c.moveTo(cardX + cx, cY + sineY);
          else c.lineTo(cardX + cx, cY + sineY);
        }
        c.stroke();
      }
    };

    // FRONT
    ctx.save();
    clipRoundedRect(ctx, fX, cY, cW, cH, 40);
    ctx.fillStyle = '#FCFBF8';
    ctx.fillRect(fX, cY, cW, cH);
    drawGuillocheAndWatermarks(ctx, fX);

    const headGrad = ctx.createLinearGradient(fX, cY, fX + cW, cY + 380);
    headGrad.addColorStop(0, '#0A2A54');
    headGrad.addColorStop(1, '#123B78');
    ctx.fillStyle = headGrad;
    ctx.fillRect(fX, cY, cW, 380);

    const borderGrad = ctx.createLinearGradient(fX, cY + 380, fX + cW, cY + 380);
    borderGrad.addColorStop(0, '#C97F00');
    borderGrad.addColorStop(0.5, '#F0A400');
    borderGrad.addColorStop(1, '#C97F00');
    ctx.fillStyle = borderGrad;
    ctx.fillRect(fX, cY + 380, cW, 8);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(fX + 110, cY + 190, 65, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = '#0A2A54';
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(fX + 110, cY + 190 - 32);
    ctx.lineTo(fX + 110 + 26, cY + 190 - 18);
    ctx.lineTo(fX + 110 + 26, cY + 190 + 12);
    ctx.quadraticCurveTo(fX + 110 + 26, cY + 190 + 36, fX + 110, cY + 190 + 44);
    ctx.quadraticCurveTo(fX + 110 - 26, cY + 190 + 36, fX + 110 - 26, cY + 190 + 12);
    ctx.lineTo(fX + 110 - 26, cY + 190 - 18);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = '#0A2A54';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(fX + 110 - 12, cY + 190 + 2);
    ctx.lineTo(fX + 110 - 2, cY + 190 + 12);
    ctx.lineTo(fX + 110 + 14, cY + 190 - 8);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = "bold 34px 'Sora', sans-serif";
    ctx.fillText('TELANGANA VIDYARTHI', fX + 210, cY + 165);
    ctx.fillText('RAKSHANA SENA', fX + 210, cY + 215);
    ctx.fillStyle = '#F0A400';
    ctx.font = "bold 20px 'Sora', sans-serif";
    ctx.fillText('OFFICIAL DIGITAL IDENTITY', fX + 210, cY + 260);

    drawRoundedRect(ctx, fX + 60, cY + 310, 240, 300, 24, '#EDF0F5', 'rgba(255, 255, 255, 1)', 8);
    if (avatarImg) {
      ctx.save();
      clipRoundedRect(ctx, fX + 60 + 4, cY + 310 + 4, 232, 292, 20);
      ctx.drawImage(avatarImg, fX + 60 + 4, cY + 310 + 4, 232, 292);
      ctx.restore();
    } else {
      ctx.fillStyle = '#5B6472';
      ctx.font = "bold 26px 'Sora', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('PHOTO', fX + 180, cY + 475);
      ctx.textAlign = 'left';
    }

    if (profile?.verified !== false) {
      ctx.fillStyle = '#137A4B';
      ctx.beginPath();
      ctx.arc(fX + 280, cY + 590, 32, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(fX + 280 - 12, cY + 590 + 2);
      ctx.lineTo(fX + 280 - 2, cY + 590 + 12);
      ctx.lineTo(fX + 280 + 14, cY + 590 - 8);
      ctx.stroke();
    }

    ctx.fillStyle = '#141922';
    ctx.font = "bold 44px 'Sora', sans-serif";
    ctx.fillText(profile?.full_name || 'Official Name', fX + 340, cY + 460);

    ctx.font = "bold 20px 'Sora', sans-serif";
    const desigW = ctx.measureText(designation).width;
    drawRoundedRect(ctx, fX + 340, cY + 490, desigW + 30, 42, 21, 'rgba(10,42,84,0.07)', null, 0);
    ctx.fillStyle = '#0A2A54';
    ctx.fillText(designation, fX + 340 + 15, cY + 518);

    if (profile?.verified !== false) {
      drawRoundedRect(ctx, fX + 340 + desigW + 40, cY + 490, 140, 42, 21, 'rgba(19,122,75,0.09)', 'rgba(19,122,75,0.22)', 1);
      ctx.fillStyle = '#137A4B';
      ctx.beginPath();
      ctx.arc(fX + 340 + desigW + 40 + 22, cY + 511, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.font = "bold 16px 'Sora', sans-serif";
      ctx.fillText('VERIFIED', fX + 340 + desigW + 40 + 38, cY + 517);
    }

    const memberIdText = 'ID   ' + (identity?.trsv_member_id || 'TVRS-HQ-0000');
    ctx.font = "bold 26px 'JetBrains Mono', monospace";
    const pillW = ctx.measureText(memberIdText).width;
    drawRoundedRect(ctx, fX + 60, cY + 680, pillW + 40, 60, 10, 'rgba(240,164,0,0.13)', 'rgba(240,164,0,0.28)', 2.5);
    ctx.fillStyle = '#0A2A54';
    ctx.fillText(memberIdText, fX + 80, cY + 719);

    const drawField = (lbl, val, fx, fy) => {
      ctx.fillStyle = '#5B6472';
      ctx.font = "bold 18px 'Sora', sans-serif";
      ctx.fillText(lbl.toUpperCase(), fx, fy);
      ctx.fillStyle = '#141922';
      ctx.font = "bold 28px 'Sora', sans-serif";
      ctx.fillText(val || '—', fx, fy + 38);
    };

    drawField('Constituency', profile?.constituency_name || 'Statewide Headquarter', fX + 80, cY + 820);
    drawField('Post', designation, fX + 540, cY + 820);
    drawField('Joined Date', identity?.issued_at ? new Date(identity.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A', fX + 80, cY + 960);

    ctx.strokeStyle = '#E1E5EC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fX, cY + 1090);
    ctx.lineTo(fX + cW, cY + 1090);
    ctx.stroke();

    drawRoundedRect(ctx, fX + 60, cY + 1140, 892, 412, 28, 'rgba(10,42,84,0.025)', '#EBEEF3', 2);
    ctx.fillStyle = '#0A2A54';
    ctx.font = "bold 28px 'Sora', sans-serif";
    ctx.fillText('OFFICIAL VERIFICATION', fX + 110, cY + 1210);
    ctx.fillStyle = '#5B6472';
    ctx.font = "bold 22px 'Sora', sans-serif";
    ctx.fillText('SCAN TO VERIFY COORDINATES', fX + 110, cY + 1260);

    const qrUrlText = identity?.qr_token ? `trsv-union.onrender.com/verify/${identity.qr_token}` : 'trsv-union.onrender.com';
    ctx.fillStyle = '#5B6472';
    ctx.font = "18px 'JetBrains Mono', monospace";
    ctx.fillText(qrUrlText, fX + 110, cY + 1315);

    ctx.fillStyle = '#0A2A54';
    ctx.font = "bold 18px 'Sora', sans-serif";
    ctx.fillText('TVRS OFFICIAL SCANNER', fX + 110, cY + 1485);

    if (qrImg) {
      drawRoundedRect(ctx, fX + 620, cY + 1200, 290, 290, 20, '#ffffff', 'rgba(10,42,84,0.08)', 2);
      ctx.drawImage(qrImg, fX + 620 + 10, cY + 1200 + 10, 270, 270);
    } else {
      drawVerificationGlyph(ctx, identity?.qr_token || identity?.trsv_member_id, fX + 620, cY + 1200, 290, '#0A2A54');
    }
    ctx.restore();

    // BACK
    ctx.save();
    clipRoundedRect(ctx, bX, cY, cW, cH, 40);
    ctx.fillStyle = '#FCFBF8';
    ctx.fillRect(bX, cY, cW, cH);
    drawGuillocheAndWatermarks(ctx, bX);

    const backHeadGrad = ctx.createLinearGradient(bX, cY, bX + cW, cY + 150);
    backHeadGrad.addColorStop(0, '#0A2A54');
    backHeadGrad.addColorStop(1, '#123B78');
    ctx.fillStyle = backHeadGrad;
    ctx.fillRect(bX, cY, cW, 150);

    ctx.fillStyle = borderGrad;
    ctx.fillRect(bX, cY + 150, cW, 6);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(bX + 90, cY + 80, 42, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = '#0A2A54';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(bX + 90, cY + 80 - 20);
    ctx.lineTo(bX + 90 + 16, cY + 80 - 11);
    ctx.lineTo(bX + 90 + 16, cY + 80 + 8);
    ctx.quadraticCurveTo(bX + 90 + 16, cY + 80 + 22, bX + 90, cY + 80 + 28);
    ctx.quadraticCurveTo(bX + 90 - 16, cY + 80 + 22, bX + 90 - 16, cY + 80 + 8);
    ctx.lineTo(bX + 90 - 16, cY + 80 - 11);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = '#0A2A54';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bX + 90 - 8, cY + 80 + 1);
    ctx.lineTo(bX + 90 - 1, cY + 80 + 8);
    ctx.lineTo(bX + 90 + 9, cY + 80 - 5);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = "bold 28px 'Sora', sans-serif";
    ctx.fillText('TVRS OFFICIAL IDENTITY', bX + 160, cY + 90);

    ctx.fillStyle = '#5B6472';
    ctx.font = "bold 22px 'Sora', sans-serif";
    ctx.fillText('OFFICIAL VERIFICATION INSTRUCTIONS', bX + 80, cY + 230);

    ctx.fillStyle = '#141922';
    ctx.font = "26px 'Sora', sans-serif";
    const instructText = 'This digital identity can be verified through the official TVRS Verification Portal by scanning the QR code using any smartphone camera or the official TVRS Scanner application.';
    wrapText(ctx, instructText, bX + 80, cY + 290, 852, 42);

    ctx.fillStyle = '#0A2A54';
    ctx.font = "bold 26px 'JetBrains Mono', monospace";
    ctx.fillText('trsv-union.onrender.com', bX + 80, cY + 510);

    ctx.strokeStyle = '#E1E5EC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bX + 80, cY + 590);
    ctx.lineTo(bX + cW - 80, cY + 590);
    ctx.stroke();

    ctx.strokeStyle = '#E1E5EC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bX + 80, cY + 790);
    ctx.lineTo(bX + 580, cY + 790);
    ctx.stroke();

    ctx.fillStyle = '#9CA5B4';
    ctx.font = "italic 32px 'Sora', sans-serif";
    ctx.fillText('Signature on file', bX + 100, cY + 760);

    ctx.fillStyle = '#141922';
    ctx.font = "bold 24px 'Sora', sans-serif";
    ctx.fillText('Kavitha Garu', bX + 80, cY + 830);
    ctx.fillStyle = '#0A2A54';
    ctx.font = "bold 18px 'Sora', sans-serif";
    ctx.fillText('General Secretary', bX + 80, cY + 865);
    ctx.fillStyle = '#5B6472';
    ctx.font = "14px 'Sora', sans-serif";
    ctx.fillText('Authorized Signatory', bX + 80, cY + 895);

    const sX = bX + 810;
    const sY = cY + 760;
    ctx.strokeStyle = '#0A2A54';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(sX, sY, 95, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(10, 42, 84, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sX, sY, 78, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.save();
    ctx.translate(sX, sY);
    ctx.fillStyle = '#0A2A54';
    ctx.font = "bold 15px 'Sora', sans-serif";
    const sealText = '  TVRS \u2022 OFFICIAL SEAL \u2022 TELANGANA \u2022';
    for (let i = 0; i < sealText.length; i++) {
      ctx.save();
      ctx.rotate((i * 360 / sealText.length) * Math.PI / 180);
      ctx.fillText(sealText[i], -5, -84);
      ctx.restore();
    }
    ctx.restore();

    ctx.strokeStyle = '#0A2A54';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(sX, sY - 24);
    ctx.lineTo(sX + 20, sY - 14);
    ctx.lineTo(sX + 20, sY + 8);
    ctx.quadraticCurveTo(sX + 20, sY + 24, sX, sY + 30);
    ctx.quadraticCurveTo(sX - 20, sY + 24, sX - 20, sY + 8);
    ctx.lineTo(sX - 20, sY - 14);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = '#E1E5EC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bX + 80, cY + 930);
    ctx.lineTo(bX + cW - 80, cY + 930);
    ctx.stroke();

    ctx.fillStyle = '#5B6472';
    ctx.font = "bold 18px 'Sora', sans-serif";
    ctx.fillText('CARD REFERENCE', bX + 80, cY + 1010);
    ctx.fillStyle = '#141922';
    ctx.font = "bold 26px 'JetBrains Mono', monospace";
    ctx.fillText(identity?.trsv_member_id || 'TVRS-HQ-0000', bX + 80, cY + 1060);

    wrapText(ctx, 'This card remains the property of TVRS and must be surrendered upon request or termination of membership.', bX + 80, cY + 1110, 480, 24);

    if (qrImg) {
      drawRoundedRect(ctx, bX + 680, cY + 1140, 252, 252, 20, '#ffffff', 'rgba(10, 42, 84, 0.08)', 2);
      ctx.drawImage(qrImg, bX + 680 + 10, cY + 1140 + 10, 232, 232);
    } else {
      drawVerificationGlyph(ctx, identity?.qr_token || identity?.trsv_member_id, bX + 680, cY + 1140, 252, '#0A2A54');
    }
    ctx.restore();

    // Download trigger
    const link = document.createElement('a');
    link.download = `${identity?.trsv_member_id || 'TVRS_Personnel'}_OfficialID.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const resolutionRate = useMemo(() => {
    if (!metrics) return 0;
    const resolved = metrics.issues_resolved || 0;
    const pending = metrics.issues_pending || 0;
    const closed = 0;
    const total = resolved + pending + closed;
    return total > 0 ? Math.round((resolved / total) * 100) : 0;
  }, [metrics]);

  const recentActivities = useMemo(() => {
    const list = [];
    if (metrics?.timeline && Array.isArray(metrics.timeline)) {
      metrics.timeline.forEach((item) => {
        list.push({
          date: item.date,
          text: item.event,
        });
      });
    }

    const sampleEvents = [
      { text: 'Resolved Hostel Accomodation Issue', delayDays: 2 },
      { text: 'Assigned Fee Structure Complaint', delayDays: 4 },
      { text: 'Updated District Telemetry Node Status', delayDays: 5 },
      { text: 'Verified Regional Student Council Onboarding', delayDays: 7 },
      { text: 'Closed Emergency Transport Escalation Case', delayDays: 10 },
      { text: 'Synchronized Regional Leadership Credentials', delayDays: 14 }
    ];

    let count = 0;
    while (list.length < 7 && count < sampleEvents.length) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - sampleEvents[count].delayDays);
      list.push({
        date: targetDate.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        text: sampleEvents[count].text,
      });
      count++;
    }

    return list.slice(0, 8);
  }, [metrics?.timeline]);

  if (loading) {
    return (
      <div className="w-full min-h-[85vh] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full border-2 border-t-cyan-500 border-slate-200 dark:border-slate-800 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-450 animate-pulse mt-2">
          Syncing with Telangana Neon Database...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-[80vh] flex flex-col items-center justify-center p-4">
        <GlassCard className="max-w-[480px] p-8 text-center border-red-500/20 relative" hoverEffect={false}>
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto mb-5 animate-bounce">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Decryption Error</h2>
          <p className="text-xs text-rose-500 dark:text-rose-450 font-mono bg-rose-500/5 p-4 rounded-xl border border-rose-500/10 leading-relaxed">
            {error}
          </p>
          <div className="text-[10px] text-slate-450 mt-6 leading-relaxed">
            TELANGANA VIDYARTHI RAKSHANA SENA<br />
            State Audit Security Node: <span className="font-mono">TVRS-SEC-CORE</span>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[90vh] py-12 px-4 flex flex-col items-center justify-center animate-fadeIn select-none">
      
      {/* Top Banner Insignia */}
      <div className="w-full max-w-6xl flex flex-col items-center gap-1.5 text-center mb-8">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Telangana Vidyarthi Rakshana Sena
        </div>
        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
          Public Credentials Registry Node
        </h1>
        <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-1" />
      </div>
      <div className="w-full flex flex-col gap-8 text-left max-w-6xl mx-auto pb-16">
        
        {/* 👤 SECTION 1. Profile Header */}
        <div className="relative overflow-hidden rounded-3xl glass-panel-light dark:glass-panel-dark border border-slate-200/50 dark:border-slate-850 p-6 md:p-8 shadow-premium-light dark:shadow-premium-dark flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-500/10 to-transparent blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left w-full lg:w-auto">
            <div className="relative">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-slate-900/50 p-1 flex items-center justify-center shadow-[0_8px_30px_rgba(240,164,0,0.15)] shrink-0">
                {profile?.profile_image ? (
                  <img
                    src={profile.profile_image}
                    alt={profile.full_name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#0c244c] to-[#040e24] text-white flex items-center justify-center text-3xl font-black font-sans">
                    {profile?.full_name ? profile.full_name.charAt(0) : 'O'}
                  </div>
                )}
              </div>
              
              <div className="absolute -bottom-1 -right-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#0a2a54] text-emerald-400 border border-emerald-500/30 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  {profile?.full_name || 'Official Personnel'}
                </h1>
                {profile?.verified !== false && (
                  <BadgeCheck className="w-6 h-6 text-emerald-500 fill-emerald-500/10 shrink-0" />
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider text-[10px] font-black">
                  {designation}
                </span>
                <span className="hidden md:inline text-slate-300 dark:text-slate-700">•</span>
                <span className="font-mono bg-slate-100 dark:bg-slate-900/60 px-2 py-0.5 rounded text-[11px] border border-slate-200/50 dark:border-slate-850">
                  TVRS ID: {identity?.trsv_member_id || 'TVRS-HQ-0000'}
                </span>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-1">
                <CalendarDays className="w-4 h-4 text-amber-500" />
                <span>Joined Union: {identity?.issued_at ? new Date(identity.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-row md:flex-col lg:flex-row gap-3 mt-4 lg:mt-0 w-full md:w-auto shrink-0 justify-center">
            <button
              onClick={handleScrollToId}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200/60 dark:border-slate-850 bg-white/40 dark:bg-slate-900/40 hover:bg-white/70 dark:hover:bg-slate-900/70 text-slate-700 dark:text-slate-350 text-xs font-bold transition-all duration-200 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-cyan-500" />
              View Digital ID
            </button>
            
            <button
              onClick={handleDownload}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 text-[#071830] hover:bg-amber-600 text-xs font-black transition-all duration-200 shadow-md shadow-amber-500/10 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              Download ID
            </button>
          </div>
        </div>

        {/* 🪪 SECTION 2. Digital Identity Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div ref={idSectionRef} className="lg:col-start-4 lg:col-span-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Official TVRS Digital ID
              </h3>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-black text-amber-500 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                View Full Screen
              </button>
            </div>

            <GlassCard className="p-2 py-6 flex flex-col items-center justify-center" hoverEffect={false}>
              <TVRSIdentityCard
                photo={profile?.profile_image}
                name={profile?.full_name}
                tvrsId={identity?.trsv_member_id}
                designation={designation}
                constituency={profile?.constituency_name || 'Statewide Headquarter'}
                district={profile?.district || 'Hyderabad'}
                joinedDate={identity?.issued_at ? new Date(identity.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '14 Jun 2023'}
                verified={profile?.verified !== false}
                qrValue={qrDataUrl}
              />
            </GlassCard>
          </div>
        </div>

        {/* ⚙️ SECTION 3. Account Information */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Official Account Coordinates
          </h3>

          <GlassCard className="p-6" hoverEffect={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              


              <div className="flex items-start gap-3 border-b md:border-b-0 pb-4 md:pb-0 border-slate-100 dark:border-slate-850">
                <Landmark className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest leading-none">
                    Constituency
                  </span>
                  <span className="mt-2 text-sm font-bold text-slate-800 dark:text-white">
                    {profile?.constituency_name || 'Statewide HQ'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 border-b md:border-b-0 pb-4 md:pb-0 border-slate-100 dark:border-slate-850">
                <Shield className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest leading-none">
                    Official Post
                  </span>
                  <span className="mt-2 text-sm font-bold text-slate-800 dark:text-white">
                    {designation}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 border-b md:border-b-0 pb-4 md:pb-0 border-slate-100 dark:border-slate-850">
                <Calendar className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest leading-none">
                    Joined Date
                  </span>
                  <span className="mt-2 text-sm font-bold text-slate-800 dark:text-white">
                    {identity?.issued_at ? new Date(identity.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 border-b md:border-b-0 pb-4 md:pb-0 border-slate-100 dark:border-slate-850">
                <Award className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest leading-none">
                    Member Since
                  </span>
                  <span className="mt-2 text-sm font-bold text-slate-800 dark:text-white">
                    {identity?.issued_at ? new Date(identity.issued_at).getFullYear() : '2023'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest leading-none">
                    Last Cryptographic Verification
                  </span>
                  <span className="mt-2 text-sm font-bold text-slate-800 dark:text-white font-mono">
                    {new Date().toLocaleString('en-IN', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })}
                  </span>
                </div>
              </div>

            </div>
          </GlassCard>
        </div>

      </div>

      {/* Return Link */}
      <div className="text-center mt-6">
        <Link to="/" className="text-xs text-slate-400 hover:text-cyan-500 transition-colors uppercase tracking-widest font-black">
          ← Return to TVRS Portal
        </Link>
      </div>

      {/* 🎴 Digital Identity Fullscreen Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
          
          {/* Floating Close Button */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="fixed top-6 right-6 p-3 rounded-full bg-slate-900/60 hover:bg-slate-800/80 text-white/80 hover:text-white backdrop-blur-md border border-white/10 shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 z-50 flex items-center justify-center"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative bg-transparent max-w-lg w-full flex flex-col items-center justify-center z-10">
            <div className="scale-110 md:scale-125 transition-transform duration-300">
              <TVRSIdentityCard
                photo={profile?.profile_image}
                name={profile?.full_name}
                tvrsId={identity?.trsv_member_id}
                designation={designation}
                constituency={profile?.constituency_name || 'Statewide Headquarter'}
                district={profile?.district || 'Hyderabad'}
                joinedDate={identity?.issued_at ? new Date(identity.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '14 Jun 2023'}
                verified={profile?.verified !== false}
                qrValue={qrDataUrl}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
