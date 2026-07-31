// import { notFound } from "next/navigation";
// import { Star, CheckCircle2, Calendar } from "lucide-react";
// import { Container, Section } from "@/components/site/section";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { lawyerApi } from "@/lib/api";
// import AppointmentCalendar from "../appointment-calendar";

// export const revalidate = 60;

// export async function generateStaticParams() {
//   try {
//     const { data } = await lawyerApi.listPublicDirectory({ page: 1, limit: 100 });
//     return (data.data ?? []).map((l) => ({ id: l.id }));
//   } catch {
//     return [];
//   }
// }

// async function getLawyer(id) {
//   try {
//     const { data } = await lawyerApi.getPublicProfile(id);
//     return data.data;
//   } catch {
//     return null;
//   }
// }

// export async function generateMetadata({ params }) {
//   const lawyer = await getLawyer(params.id);
//   if (!lawyer) return {};
//   return { title: lawyer.user?.name, description: lawyer.bio };
// }

// function formatSlotTime(iso) {
//   return new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
// }

// export default async function LawyerDetailPage({ params }) {
//   const lawyer = await getLawyer(params.id);
//   if (!lawyer) notFound();

//   let slots = [];
//   try {
//     const { data } = await lawyerApi.listSlots(params.id, {});
//     slots = (data.data ?? []).slice(0, 4);
//   } catch {
//     slots = [];
//   }

//   return (
//     <Section className="pt-14">
//       <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
//         <div>
//           <div className="flex items-start gap-5">
//             <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-ink font-display text-3xl text-cream-white">
//               {(lawyer.user?.name || "L").split(" ").slice(-1)[0][0]}
//             </div>
//             <div>
//               <div className="flex flex-wrap items-center gap-3">
//                 <h1 className="font-display text-3xl text-ink">{lawyer.user?.name}</h1>
//                 <Badge variant="verified">
//                   <CheckCircle2 className="h-3 w-3" /> Verified
//                 </Badge>
//               </div>
//               <p className="mt-1 text-ink-muted">{(lawyer.specializations || []).join(", ")}</p>
//               <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
//                 {lawyer.avgRating ? (
//                   <span className="flex items-center gap-1">
//                     <Star className="h-4 w-4 fill-brass text-brass" />
//                     <span className="text-ink">{lawyer.avgRating.toFixed(1)}</span> ({lawyer.reviewCount} reviews)
//                   </span>
//                 ) : (
//                   <span>New on the platform</span>
//                 )}
//                 <span className="font-mono">{lawyer.experienceYears} years practicing</span>
//               </div>
//             </div>
//           </div>

//           <Separator className="my-8" />

//           {lawyer.bio && (
//             <>
//               <h2 className="font-display text-xl text-ink">About</h2>
//               <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">{lawyer.bio}</p>
//             </>
//           )}
//         </div>

//         <Card className="h-fit p-6">
//           <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">Consultation fee</p>
//           <p className="mt-1 font-display text-3xl text-ink">₹{Number(lawyer.consultationCharge).toLocaleString("en-IN")}</p>

//           <p className="mt-6 flex items-center gap-2 text-sm font-medium text-ink">
//             <Calendar className="h-4 w-4 text-seal" /> Next available slots
//           </p>
//           <div className="mt-3 space-y-2">
//             {slots.length === 0 ? (
//               <p className="text-sm text-ink-muted">No open slots right now — check back soon.</p>
//             ) : (
//               slots.map((slot) => (
//                 <div
//                   key={slot.id}
//                   className="w-full rounded-sm border border-ink/15 px-3.5 py-2.5 text-left text-sm text-ink"
//                 >
//                   {formatSlotTime(slot.startTime)}
//                 </div>
//               ))
//             )}
//           </div>

//           <Button className="mt-6 w-full" size="lg" asChild>
//             <a href="/register">Book a consultation</a>
//           </Button>
//           <p className="mt-3 text-center text-xs text-ink-muted">You&rsquo;ll need an account to book</p>
//         </Card>
//       </Container>
//     </Section>
//   );
// }



// import { notFound } from "next/navigation";
// import { Star, CheckCircle2 } from "lucide-react";

// import { Container, Section } from "@/components/site/section";
// import { Card } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { lawyerApi } from "@/lib/api";
// import AppointmentCalendar from "../appointment-calendar";

// export const revalidate = 60;

// export async function generateStaticParams() {
//   try {
//     const { data } = await lawyerApi.listPublicDirectory({
//       page: 1,
//       limit: 100,
//     });

//     return (data.data ?? []).map((lawyer) => ({
//       id: lawyer.id,
//     }));
//   } catch {
//     return [];
//   }
// }

// async function getLawyer(id) {
//   try {
//     const { data } = await lawyerApi.getPublicProfile(id);
//     return data.data;
//   } catch {
//     return null;
//   }
// }

// export async function generateMetadata({ params }) {
//   const lawyer = await getLawyer(params.id);

//   if (!lawyer) {
//     return {};
//   }

//   return {
//     title: lawyer.user?.name,
//     description: lawyer.bio,
//   };
// }

// export default async function LawyerDetailPage({ params }) {
//   const lawyer = await getLawyer(params.id);

//   if (!lawyer) {
//     notFound();
//   }

//   const lawyerName = lawyer.user?.name || "Lawyer";
//   const lawyerInitial =
//     lawyerName.trim().split(/\s+/).slice(-1)[0]?.charAt(0).toUpperCase() || "L";

//   return (
//     <Section className="pt-14">
//       <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_420px]">
//         <div>
//           <div className="flex items-start gap-5">
//             <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-ink font-display text-3xl text-cream-white">
//               {lawyerInitial}
//             </div>

//             <div>
//               <div className="flex flex-wrap items-center gap-3">
//                 <h1 className="font-display text-3xl text-ink">
//                   {lawyerName}
//                 </h1>

//                 <Badge variant="verified">
//                   <CheckCircle2 className="h-3 w-3" />
//                   Verified
//                 </Badge>
//               </div>

//               <p className="mt-1 text-ink-muted">
//                 {(lawyer.specializations || []).join(", ")}
//               </p>

//               <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
//                 {lawyer.avgRating ? (
//                   <span className="flex items-center gap-1">
//                     <Star className="h-4 w-4 fill-brass text-brass" />

//                     <span className="text-ink">
//                       {Number(lawyer.avgRating).toFixed(1)}
//                     </span>

//                     <span>({lawyer.reviewCount} reviews)</span>
//                   </span>
//                 ) : (
//                   <span>New on the platform</span>
//                 )}

//                 <span className="font-mono">
//                   {lawyer.experienceYears} years practicing
//                 </span>
//               </div>
//             </div>
//           </div>

//           <Separator className="my-8" />

//           {lawyer.bio && (
//             <>
//               <h2 className="font-display text-xl text-ink">About</h2>

//               <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">
//                 {lawyer.bio}
//               </p>
//             </>
//           )}
//         </div>

//         <Card className="h-fit p-6">
//           <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
//             Consultation fee
//           </p>

//           <p className="mt-1 font-display text-3xl text-ink">
//             ₹
//             {Number(lawyer.consultationCharge || 0).toLocaleString("en-IN")}
//           </p>

//           <AppointmentCalendar
//             lawyerProfileId={lawyer.id}
//             consultationCharge={lawyer.consultationCharge}
//           />
//         </Card>
//       </Container>
//     </Section>
//   );
// }



import { notFound } from "next/navigation";
import { Star, CheckCircle2 } from "lucide-react";

import { Container, Section } from "@/components/site/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { lawyerApi } from "@/lib/api";
import AppointmentCalendar from "../appointment-calendar";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const { data } = await lawyerApi.listPublicDirectory({
      page: 1,
      limit: 100,
    });

    return (data.data ?? []).map((lawyer) => ({
      id: lawyer.id,
    }));
  } catch {
    return [];
  }
}

async function getLawyer(id) {
  try {
    const { data } = await lawyerApi.getPublicProfile(id);
    return data.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;

  const lawyer = await getLawyer(id);

  if (!lawyer) {
    return {};
  }

  return {
    title: lawyer.user?.name || "Lawyer Profile",
    description:
      lawyer.bio ||
      "View lawyer profile and book a consultation appointment.",
  };
}

export default async function LawyerDetailPage({ params }) {
  const { id } = await params;

  const lawyer = await getLawyer(id);

  if (!lawyer) {
    notFound();
  }

  const lawyerName = lawyer.user?.name || "Lawyer";

  const lawyerInitial =
    lawyerName
      .trim()
      .split(/\s+/)
      .slice(-1)[0]
      ?.charAt(0)
      .toUpperCase() || "L";

  return (
    <Section className="pt-14">
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-ink font-display text-3xl text-cream-white">
              {lawyerInitial}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl text-ink">
                  {lawyerName}
                </h1>

                <Badge variant="verified">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </Badge>
              </div>

              <p className="mt-1 text-ink-muted">
                {(lawyer.specializations || []).join(", ")}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
                {lawyer.avgRating ? (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-brass text-brass" />

                    <span className="text-ink">
                      {Number(lawyer.avgRating).toFixed(1)}
                    </span>

                    <span>
                      ({lawyer.reviewCount || 0} reviews)
                    </span>
                  </span>
                ) : (
                  <span>New on the platform</span>
                )}

                <span className="font-mono">
                  {lawyer.experienceYears || 0} years practicing
                </span>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {lawyer.bio && (
            <>
              <h2 className="font-display text-xl text-ink">
                About
              </h2>

              <p className="mt-3 max-w-2xl leading-relaxed text-ink-muted">
                {lawyer.bio}
              </p>
            </>
          )}
        </div>

        <Card className="h-fit p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
            Consultation fee
          </p>

          <p className="mt-1 font-display text-3xl text-ink">
            ₹
            {Number(
              lawyer.consultationCharge || 0
            ).toLocaleString("en-IN")}
          </p>

          <AppointmentCalendar
            lawyerProfileId={lawyer.id}
            consultationCharge={lawyer.consultationCharge}
          />
        </Card>
      </Container>
    </Section>
  );
}