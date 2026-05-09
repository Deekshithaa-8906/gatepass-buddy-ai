import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Phone, Building2, Lock, ShieldCheck, ChevronDown } from 'lucide-react';
import { AvatarUpload } from '../common/AvatarUpload';
import { useAuth } from '../../contexts/AuthContext';

const principalSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, "Must be a valid 10-digit mobile number"),
  institute: z.string().min(1, "Campus is required"),
});

type PrincipalFormData = z.infer<typeof principalSchema>;

export function PrincipalForm() {
  const { user, profile } = useAuth();
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<PrincipalFormData>({
    resolver: zodResolver(principalSchema),
    defaultValues: {
      fullName: profile?.full_name || '',
    }
  });

  const onSubmit = async (data: PrincipalFormData) => {
    setIsSubmitting(true);
    try {
      const finalData = {
        ...data,
        role: 'principal',
      };
      
      console.log('Frontend State - Principal Form:', finalData);
      if (profileImage) {
        console.log('Profile image to upload:', profileImage.name);
      }
      
      alert('Onboarding data saved locally (backend connection skipped as requested). Check console for payload.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const institutes = [
    "SNS College of Technology",
    "Dr.SNS Rajalakshmi College Arts and Science",
    "SNS College of Pharmacy and Health Sciences",
    "SNS College of Nursing",
    "SNS College of Physiotherapy",
    "SNS College of Allied Health Science"
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-center mb-8">
        <AvatarUpload 
          name={profile?.full_name || 'Principal'} 
          imageUrl={previewUrl}
          onImageChange={(file, url) => {
            setProfileImage(file);
            setPreviewUrl(url);
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email (readonly) */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-gray-900 ml-1 flex items-center gap-1.5">
            Email Address <Lock className="w-3 h-3 text-[#CD0000]" />
          </label>
          <div className="relative">
            <input type="email" readOnly value={user?.email || ''} 
              className="w-full px-4 py-3 bg-gray-100/80 border border-gray-200/60 rounded-xl outline-none text-gray-700 font-bold shadow-sm cursor-not-allowed select-none"
            />
          </div>
        </div>

        {/* Role (Fixed) */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-gray-900 ml-1 flex items-center gap-1.5">
            Assigned Role <Lock className="w-3 h-3 text-[#CD0000]" />
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ShieldCheck className="h-5 w-5 text-[#CD0000]" />
            </div>
            <input type="text" readOnly value="Principal" 
              className="w-full pl-10 pr-4 py-3 bg-gray-100/80 border border-gray-200/60 rounded-xl outline-none text-gray-700 font-bold shadow-sm cursor-not-allowed select-none"
            />
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-900 ml-1">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" placeholder="Enter your full name" {...register("fullName")}
              className={`w-full pl-10 pr-4 py-3 bg-white border ${errors.fullName ? 'border-red-500' : 'border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20'} rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm`}
            />
          </div>
          {errors.fullName && <p className="text-red-500 text-xs ml-1 font-medium">{errors.fullName.message}</p>}
        </div>

        {/* Mobile Number */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-900 ml-1">Mobile Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input type="tel" placeholder="10-digit number" {...register("mobileNumber")}
              className={`w-full pl-10 pr-4 py-3 bg-white border ${errors.mobileNumber ? 'border-red-500' : 'border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20'} rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm`}
            />
          </div>
          {errors.mobileNumber && <p className="text-red-500 text-xs ml-1 font-medium">{errors.mobileNumber.message}</p>}
        </div>

        {/* Institute */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-gray-900 ml-1">Campus (Institute)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building2 className="h-5 w-5 text-gray-400" />
            </div>
            <select {...register("institute")} defaultValue="" className={`w-full pl-10 pr-10 py-3 bg-white border ${errors.institute ? 'border-red-500' : 'border-gray-200 focus:border-[#CD0000] focus:ring-2 focus:ring-[#CD0000]/20'} rounded-xl outline-none transition-all text-gray-900 font-medium shadow-sm appearance-none`}>
              <option value="" disabled>Select Campus</option>
              {institutes.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          {errors.institute && <p className="text-red-500 text-xs ml-1 font-medium">{errors.institute.message}</p>}
        </div>

      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
        <button disabled={isSubmitting} type="submit" className="w-full sm:w-auto px-10 py-4 bg-[#CD0000] hover:bg-[#a80000] text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 text-center text-lg disabled:opacity-70 disabled:cursor-not-allowed">
          {isSubmitting ? 'Saving Profile...' : 'Complete Onboarding'}
        </button>
      </div>
    </form>
  );
}
