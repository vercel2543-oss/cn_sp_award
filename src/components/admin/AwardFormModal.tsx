import React, { useState, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  Check, 
  AlertCircle, 
  Database, 
  Sparkles, 
  Image as ImageIcon, 
  FileText, 
  Calendar, 
  Building2, 
  User, 
  Tag, 
  Star, 
  Link2,
  RefreshCw,
  Flame,
  ExternalLink,
  FileCheck2,
  AlertTriangle,
  FolderArchive,
  Globe,
  Youtube,
  Cloud
} from 'lucide-react';
import { Award, AppUser, DepartmentId, AwardLevel, AwardStatus, RecipientType } from '../../types';
import { DEPARTMENTS, AWARD_LEVELS, INITIAL_ACADEMIC_YEARS } from '../../data/mockData';
import { 
  processCertificateFile, 
  formatBytes, 
  CompressionResult, 
  detectExternalUrlType,
  MAX_PDF_SIZE_BYTES,
  MAX_PDF_SIZE_LABEL 
} from '../../lib/imageCompressor';
import { formatThaiDateFull } from '../../lib/dateUtils';

interface AwardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (awardData: Partial<Award>) => Promise<void> | void;
  initialAward?: Award | null;
  currentUser: AppUser;
}

export const AwardFormModal: React.FC<AwardFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialAward,
  currentUser
}) => {
  const isSuperAdmin = currentUser.role === 'super_admin';
  const defaultDept = isSuperAdmin ? 'academic' : (currentUser.department as DepartmentId);

  // Form State
  const [awardName, setAwardName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientType, setRecipientType] = useState<RecipientType>('student');
  const [department, setDepartment] = useState<DepartmentId>(defaultDept);
  const [level, setLevel] = useState<AwardLevel>('national');
  const [academicYear, setAcademicYear] = useState('2569');
  const [awardDate, setAwardDate] = useState(new Date().toISOString().slice(0, 10));
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [featured, setFeatured] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);
  const [status, setStatus] = useState<AwardStatus>('published');

  // File Upload & Compression State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf'>('image');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load existing award if editing
  useEffect(() => {
    if (initialAward) {
      setAwardName(initialAward.awardName || '');
      setRecipientName(initialAward.recipientName || '');
      setRecipientType(initialAward.recipientType || 'student');
      setDepartment(initialAward.department || defaultDept);
      setLevel(initialAward.level || 'national');
      setAcademicYear(initialAward.academicYear || '2569');
      setAwardDate(initialAward.awardDate || new Date().toISOString().slice(0, 10));
      setOrganizer(initialAward.organizer || '');
      setDescription(initialAward.description || '');
      setImageUrlInput(initialAward.certificateUrl || initialAward.imageUrl || '');
      setExternalUrl(initialAward.externalUrl || '');
      setTagsInput(initialAward.tags?.join(', ') || '');
      setFeatured(!!initialAward.featured);
      setAllowDownload(initialAward.allowDownload !== false);
      setStatus(initialAward.status || 'published');
      
      const fileUrl = initialAward.certificateUrl || initialAward.imageUrl || '';
      setPreviewDataUrl(fileUrl);
      
      const isPdf = initialAward.fileType === 'pdf' || fileUrl.startsWith('data:application/pdf') || fileUrl.toLowerCase().endsWith('.pdf');
      setFileType(isPdf ? 'pdf' : 'image');
      setFileName(initialAward.fileName || (isPdf ? 'เกียรติบัตร_เอกสาร.pdf' : ''));
      setFileSize(initialAward.fileSize || 0);
    } else {
      // Reset form
      setAwardName('');
      setRecipientName('');
      setRecipientType('student');
      setDepartment(defaultDept);
      setLevel('national');
      setAcademicYear('2569');
      setAwardDate(new Date().toISOString().slice(0, 10));
      setOrganizer('');
      setDescription('');
      setImageUrlInput('');
      setExternalUrl('');
      setTagsInput('');
      setFeatured(false);
      setAllowDownload(true);
      setStatus('published');
      setSelectedFile(null);
      setCompressionResult(null);
      setFileType('image');
      setFileName('');
      setFileSize(0);
      setUploadProgress(null);
      setPreviewDataUrl('');
      setErrorMessage('');
    }
  }, [initialAward, defaultDept, isOpen]);

  if (!isOpen) return null;

  // Handle file selection (Image or PDF)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsCompressing(true);
    setErrorMessage('');
    setUploadProgress(30);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setUploadStatusText(isPdf ? 'กำลังตรวจสอบและจัดเตรียมไฟล์ PDF...' : 'กำลังปรับขนาดและบีบอัดภาพเพื่อประหยัดพื้นที่ Cloud...');

    try {
      const result = await processCertificateFile(file, 1280, 1280, 0.75);
      setCompressionResult(result);
      setPreviewDataUrl(result.dataUrl);
      setImageUrlInput(result.dataUrl);
      setFileType(result.fileType);
      setFileName(result.fileName);
      setFileSize(result.compressedSize);
      setUploadProgress(100);
      setUploadStatusText('ไฟล์พร้อมบันทึกลงฐานข้อมูล Firebase Cloud แล้ว');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'การประมวลผลไฟล์ล้มเหลว กรุณาตรวจสอบชนิดและขนาดไฟล์');
      setSelectedFile(null);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleTestExternalUrl = () => {
    if (!externalUrl) return;
    const url = externalUrl.startsWith('http://') || externalUrl.startsWith('https://') 
      ? externalUrl 
      : `https://${externalUrl}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenPdfPreview = () => {
    if (!previewDataUrl) return;
    window.open(previewDataUrl, '_blank', 'noopener,noreferrer');
  };

  const detectedUrlInfo = detectExternalUrlType(externalUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!awardName.trim()) {
      setErrorMessage('กรุณาระบุชื่อผลงานหรือรางวัล');
      return;
    }
    if (!recipientName.trim()) {
      setErrorMessage('กรุณาระบุชื่อผู้ได้รับรางวัล');
      return;
    }

    const finalFileUrl = previewDataUrl || imageUrlInput || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80';
    const isFinalPdf = fileType === 'pdf' || finalFileUrl.startsWith('data:application/pdf') || finalFileUrl.toLowerCase().endsWith('.pdf');

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    let cleanExternalUrl = externalUrl.trim();
    if (cleanExternalUrl && !cleanExternalUrl.startsWith('http://') && !cleanExternalUrl.startsWith('https://')) {
      cleanExternalUrl = `https://${cleanExternalUrl}`;
    }

    const awardPayload: Partial<Award> = {
      awardName: awardName.trim(),
      recipientName: recipientName.trim(),
      recipientType,
      department,
      level,
      academicYear,
      awardDate,
      organizer: organizer.trim(),
      description: description.trim(),
      certificateUrl: finalFileUrl,
      imageUrl: isFinalPdf ? 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80' : finalFileUrl,
      fileType: isFinalPdf ? 'pdf' : 'image',
      fileName: fileName || (isFinalPdf ? 'เอกสารเกียรติบัตร.pdf' : 'รูปภาพเกียรติบัตร.jpg'),
      fileSize: fileSize || (compressionResult ? compressionResult.compressedSize : 0),
      externalUrl: cleanExternalUrl,
      status,
      featured,
      allowDownload,
      tags,
      driveFolder: initialAward?.driveFolder || 'ผลงานโรงเรียน/เกียรติบัตร',
      updatedAt: new Date().toISOString()
    };

    setIsSubmitting(true);
    try {
      await onSubmit(awardPayload);
      onClose();
    } catch (err) {
      console.error('Submit error:', err);
      setErrorMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {initialAward ? 'แก้ไขข้อมูลผลงาน/รางวัล' : 'บันทึกข้อมูลผลงานและรางวัลใหม่'}
              </h2>
              <p className="text-xs text-slate-300">
                รองรับไฟล์ภาพ JPG/PNG และไฟล์เอกสาร PDF พร้อมระบบประหยัดพื้นที่ Cloud
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SECTION 1: Core Award Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. ข้อมูลพื้นฐานรางวัล (General Information)
            </h3>

            {/* Award Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อผลงาน / รางวัลที่ได้รับ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น รางวัลเหรียญทอง การแข่งขันคณิตศาสตร์โอลิมปิกระดับนานาชาติ"
                value={awardName}
                onChange={(e) => setAwardName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Recipient & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อผู้ได้รับรางวัล / รายนามทีม <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายธนกฤต เมธาวีระกุล หรือ ทีม RattaBotics"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ประเภทผู้รับ
                </label>
                <select
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="student">นักเรียน</option>
                  <option value="teacher">ครูและบุคลากร</option>
                  <option value="team">ทีม / กลุ่มตัวแทน</option>
                  <option value="school">สถานศึกษา / โรงเรียน</option>
                  <option value="personnel">บุคลากรทางการศึกษา</option>
                </select>
              </div>
            </div>

            {/* Department, Level, Year, Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ฝ่ายที่รับผิดชอบ <span className="text-red-500">*</span>
                </label>
                <select
                  value={department}
                  disabled={!isSuperAdmin}
                  onChange={(e) => setDepartment(e.target.value as any)}
                  className={`w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none ${
                    !isSuperAdmin ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                  }`}
                >
                  {Object.values(DEPARTMENTS).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {!isSuperAdmin && (
                  <p className="text-[10px] text-slate-400 mt-0.5">ถูกกำหนดตามสิทธิ์ฝ่ายของคุณ</p>
                )}
              </div>

              {/* Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ระดับรางวัล <span className="text-red-500">*</span>
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  {Object.values(AWARD_LEVELS).map(lvl => (
                    <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
                  ))}
                </select>
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ปีการศึกษา <span className="text-red-500">*</span>
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  {INITIAL_ACADEMIC_YEARS.map(yr => (
                    <option key={yr.id} value={yr.year}>ปีการศึกษา {yr.year}</option>
                  ))}
                </select>
              </div>

              {/* Award Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่ได้รับรางวัล <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={awardDate}
                  onChange={(e) => setAwardDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
                {awardDate && (
                  <p className="text-[11px] text-blue-700 font-medium mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    <span>{formatThaiDateFull(awardDate)}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Organizer */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หน่วยงานผู้จัด / องค์กรที่มอบรางวัล
              </label>
              <input
                type="text"
                placeholder="เช่น กระทรวงศึกษาธิการ, คุรุสภา, สมาคมวิทยาศาสตร์ฯ"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รายละเอียดและเนื้อหาผลงานโดยย่อ
              </label>
              <textarea
                rows={3}
                placeholder="ระบุรายละเอียดความเป็นมา เกณฑ์การตัดสิน ผลงานที่ส่งเข้าประกวด..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* SECTION 2: Certificate Attachment (Image / PDF) & Firebase Optimization */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-600" />
                2. ไฟล์เกียรติบัตรและผลงาน (รองรับทั้งภาพ JPG/PNG และไฟล์เอกสาร PDF)
              </h3>
              <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>Cloud Storage Optimizer</span>
              </span>
            </div>

            {/* Client-Side Image/PDF Compressor & Upload Zone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-6 bg-slate-50/60 hover:bg-slate-50 transition-colors text-center relative group">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />

              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <p className="font-bold text-slate-800 text-sm">
                  คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์รูปภาพ/PDF มาวางที่นี่
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
                  รองรับทั้ง <strong>รูปภาพ (JPG, PNG, WEBP)</strong> และ <strong>เอกสาร PDF (จำกัดไม่เกิน {MAX_PDF_SIZE_LABEL} เพื่อประหยัดพื้นที่ Cloud)</strong>
                </p>
              </div>
            </div>

            {/* Preview Selected File (Image or PDF) */}
            {previewDataUrl && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                {fileType === 'pdf' ? (
                  <div className="w-20 h-20 rounded-xl bg-red-100 border border-red-200 text-red-600 flex flex-col items-center justify-center shrink-0 shadow-xs">
                    <FileText className="w-8 h-8" />
                    <span className="text-[10px] font-bold mt-0.5">PDF DOC</span>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl border border-slate-200 overflow-hidden bg-white shrink-0 shadow-xs">
                    <img
                      src={previewDataUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 text-xs space-y-1.5 w-full">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-emerald-600" />
                      <span>{fileType === 'pdf' ? 'ไฟล์เอกสาร PDF เกียรติบัตร' : 'ตัวอย่างรูปภาพเกียรติบัตร'}</span>
                    </p>
                    {fileType === 'pdf' && (
                      <button
                        type="button"
                        onClick={handleOpenPdfPreview}
                        className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-[11px] flex items-center gap-1 border border-red-200 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>เปิดดูตัวอย่าง PDF</span>
                      </button>
                    )}
                  </div>

                  {fileName && (
                    <p className="text-slate-600 truncate font-mono text-[11px]">
                      ชื่อไฟล์: {fileName}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {fileSize > 0 && (
                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                        ขนาด: {formatBytes(fileSize)}
                      </span>
                    )}
                    {compressionResult && compressionResult.fileType === 'image' && (
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-semibold">
                        ความละเอียด: {compressionResult.width} x {compressionResult.height} px
                      </span>
                    )}
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px]">
                      สถานะ: พร้อมบันทึกลง Cloud
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Compression Feedback Stats */}
            {isCompressing && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-3 text-xs text-blue-800">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                <span>{uploadStatusText || 'กำลังประมวลผลและปรับขนาดไฟล์ให้อยู่ในขนาดที่เหมาะสม...'}</span>
              </div>
            )}

            {/* Cloud Storage Optimization Tip */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">คำแนะนำการประหยัดพื้นที่ Cloud Firestore / Firebase:</p>
                <p className="text-amber-800 mt-0.5">
                  ระบบจะทำการบีบอัดรูปภาพให้มีความคมชัดสูงแต่อยู่ในขนาดกะทัดรัด สำหรับไฟล์ PDF แนะนำขนาดไม่เกิน {MAX_PDF_SIZE_LABEL} หากไฟล์เอกสารมีขนาดใหญ่ สามารถนำลิงก์ <strong>Google Drive / OneDrive</strong> มาใส่ในช่องลิงก์ภายนอกด้านล่างได้ทันที
                </p>
              </div>
            </div>

            {/* Manual Image / File URL Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หรือ วาง URL ลิงก์รูปภาพ/เอกสารโดยตรง
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... หรือ ลิงก์รูปภาพภายนอก"
                  value={imageUrlInput}
                  onChange={(e) => {
                    setImageUrlInput(e.target.value);
                    setPreviewDataUrl(e.target.value);
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: External URL & Online Attachments */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                3. ลิงก์ภายนอก / เอกสารแนบออนไลน์ (Google Drive / ลิงก์ข่าว / วิดีโอ)
              </h3>
              <span className="text-[11px] text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                เปิดแท็บใหม่ได้
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL ลิงก์ภายนอก (Google Drive, ข่าวผลงาน, ลิงก์เกียรติบัตรออนไลน์, YouTube)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <ExternalLink className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... หรือ https://www.youtube.com/watch?v=..."
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                {externalUrl && (
                  <button
                    type="button"
                    onClick={handleTestExternalUrl}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors shrink-0 cursor-pointer"
                    title="ทดสอบเปิดลิงก์ในแท็บใหม่"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    <span>ทดสอบเปิดลิงก์</span>
                  </button>
                )}
              </div>

              {/* Detected URL Type Badge */}
              {externalUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">ประเภทลิงก์ที่ตรวจพบ:</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${detectedUrlInfo.bgColor} ${detectedUrlInfo.textColor}`}>
                    <Check className="w-3 h-3" />
                    <span>{detectedUrlInfo.label}</span>
                  </span>
                </div>
              )}

              <p className="text-[11px] text-slate-500 mt-1.5">
                เมื่อกรอกลิงก์นี้ ในการ์ดแสดงผลงานและหน้าต่างรายละเอียดจะมีปุ่ม <strong>"เปิดลิงก์ภายนอก"</strong> เพื่อเปิดไปยังลิงก์นี้ในแท็บใหม่โดยตรง
              </p>
            </div>
          </div>

          {/* SECTION 4: Display Settings & Tags */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              4. การตั้งค่าการแสดงผลและป้ายกำกับ (Display & Tags)
            </h3>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ป้ายกำกับค้นหา (Tags คั่นด้วยเครื่องหมายจุลภาค ,)
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="เช่น โอลิมปิกวิชาการ, เหรียญทอง, นานาชาติ, คอมพิวเตอร์"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <p className="text-xs font-bold text-slate-800">ผลงานเด่น (Featured)</p>
                  <p className="text-[10px] text-slate-500">แสดงในหอเกียรติยศหน้าแรก</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                <input
                  type="checkbox"
                  checked={allowDownload}
                  onChange={(e) => setAllowDownload(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <p className="text-xs font-bold text-slate-800">อนุญาตให้ดาวน์โหลดไฟล์</p>
                  <p className="text-[10px] text-slate-500">เปิดให้ดาวน์โหลดภาพ/PDF ฉบับเต็ม</p>
                </div>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สถานะการเผยแพร่
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="published">เผยแพร่ทันที (Published)</option>
                  <option value="pending">รอการตรวจสอบ (Pending)</option>
                  <option value="draft">ฉบับร่าง (Draft)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึกลง Cloud...</span>
                </>
              ) : (
                <span>{initialAward ? 'บันทึกการแก้ไข' : 'บันทึกผลงานลง Firebase'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

