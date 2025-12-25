
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rocket, Shield, Users, Lightbulb, Target } from 'lucide-react';
import { motion } from "framer-motion";

const teamMembers = [
  {
    name: 'كابتن سفينة القيادة',
    role: 'المؤسس والرئيس التنفيذي',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    name: 'مهندسة النظم الكونية',
    role: 'مديرة قسم التكنولوجيا',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    name: 'ضابط الاتصالات الفضائية',
    role: 'رئيس قسم الدعم الفني',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
];

const values = [
    {
        icon: Lightbulb,
        title: "الابتكار المستمر",
        description: "نسعى دائمًا لاستكشاف آفاق جديدة وتقديم أحدث الحلول الرقمية التي تضمن تفوق عملائنا."
    },
    {
        icon: Shield,
        title: "الموثوقية والأمان",
        description: "أمان بياناتكم ونجاح خدماتكم هو أولويتنا القصوى. نعمل بأعلى معايير الأمان لحماية رحلتكم معنا."
    },
    {
        icon: Users,
        title: "الشراكة في النجاح",
        description: "نحن لا نقدم خدمات فقط، بل نبني شراكات حقيقية. نجاحكم هو نجاحنا، ونحن ملتزمون بدعمكم في كل خطوة."
    },
];

export default function AboutPage() {
  return (
    <div className="space-y-16 pb-8">
      <section className="text-center">
         <motion.h1 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-5xl lg:text-7xl font-bold font-headline tracking-tighter animated-gradient-text bg-gradient-to-br from-primary via-fuchsia-500 to-cyan-400"
        >
          من نحن؟
        </motion.h1>
         <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto"
        >
          نحن لسنا مجرد منصة خدمات، نحن طاقم رحلتك نحو النجاح في الفضاء الرقمي الواسع.
        </motion.p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
        >
            <h2 className="text-4xl font-bold font-headline mb-4 flex items-center gap-3"><Rocket className="h-10 w-10 text-primary"/> مهمتنا</h2>
            <p className="text-muted-foreground leading-relaxed">
              في "حاجاتي"، مهمتنا هي تمكين رواد الأعمال والشركات من تحقيق أقصى إمكاناتهم في العالم الرقمي. نحن نؤمن بأن كل فكرة تستحق أن تصل إلى أبعد مدى، لذلك نقدم الأدوات والخدمات التي تجعل هذا الوصول ممكنًا، بسرعة الصاروخ وبأعلى جودة.
            </p>
        </motion.div>
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
        >
             <h2 className="text-4xl font-bold font-headline mb-4 flex items-center gap-3"><Target className="h-10 w-10 text-secondary"/> رؤيتنا</h2>
            <p className="text-muted-foreground leading-relaxed">
              رؤيتنا هي أن نكون البوابة الأولى والموثوقة لكل من يسعى للنمو في الفضاء الرقمي في الشرق الأوسط. نطمح لبناء مجرة متكاملة من الخدمات التي تلبي كل "حاجة" رقمية، من أصغر المشاريع إلى أكبرها، مع الحفاظ على الابتكار، الشفافية، والتركيز على نجاح عملائنا.
            </p>
        </motion.div>
      </section>

      <section>
        <div className="text-center mb-12">
            <h2 className="text-4xl font-bold font-headline">قيمنا الأساسية</h2>
            <p className="text-muted-foreground mt-2">المبادئ التي توجه رحلتنا الكونية.</p>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, i) => {
                const Icon = value.icon;
                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        viewport={{ once: true }}
                    >
                        <Card className="text-center h-full transition-all duration-300 hover:scale-105 hover:shadow-primary/20">
                            <CardHeader className="items-center">
                                <div className="p-4 bg-primary/10 border border-primary/20 rounded-full mb-4 group-hover:scale-110 group-hover:animate-pulse transition-transform">
                                    <Icon className="h-8 w-8 text-primary" />
                                </div>
                                <CardTitle>{value.title}</CardTitle>
                                <CardDescription className="pt-2">{value.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    </motion.div>
                )
            })}
        </div>
      </section>

      <section>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-headline">تعرّف على طاقم القيادة</h2>
          <p className="text-muted-foreground mt-2">العقول المبدعة التي تقود هذه الرحلة.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          {teamMembers.map((member, index) => (
            <motion.div
                key={member.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-4 text-center"
            >
              <Avatar className="h-32 w-32 border-4 border-secondary/50">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold">{member.name}</h3>
                <p className="text-primary font-medium">{member.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
