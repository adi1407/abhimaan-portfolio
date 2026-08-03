export type InquiryService = "photoshop" | "post" | "both";

export type Inquiry = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  service: InquiryService;
  deliverable: string;
  deadline: string;
  budget: string;
  message: string;
  read: boolean;
};

export type InquiryInput = {
  name: string;
  email: string;
  phone?: string;
  service: InquiryService;
  deliverable?: string;
  deadline?: string;
  budget?: string;
  message: string;
};

export const INQUIRY_SERVICES = [
  { id: "photoshop" as const, label: "Photoshop / stills" },
  { id: "post" as const, label: "Post / motion" },
  { id: "both" as const, label: "Both" },
];
