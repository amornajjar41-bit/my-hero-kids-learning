import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useLang } from "@/hooks/useT";

const SECTIONS_EN = [
  {
    title: "1. Introduction",
    body: `My Hero is an educational application designed for children aged 3–15, operated by My Hero Education Ltd. By using My Hero, you (the parent or guardian) agree to these Terms and Conditions on behalf of yourself and your child. Please read them carefully before using the app.`,
  },
  {
    title: "2. Account and Subscription",
    body: `Parents or legal guardians must create and manage the My Hero account. Children must not create accounts independently.\n\n• Monthly plan: $24.99/month\n• 6-Month plan: $135.99 (save ~10%)\n• Annual plan: $236.99/year (save ~21%)\n• Free trial: 3 days — no credit card required\n• Subscriptions can be cancelled at any time through your device's App Store or Play Store settings\n• After cancellation, you will continue to have access until the end of your billing period\n• No refunds are issued for partial subscription periods, except where required by law`,
  },
  {
    title: "3. Children's Privacy",
    body: `We take your child's privacy extremely seriously:\n\n• We collect only the minimum information necessary to provide the educational service (child's name, age group, and parent email for reports)\n• We do NOT sell any personal data to third parties — ever\n• We do NOT show advertisements to children\n• All data is stored securely with industry-standard encryption\n• We do NOT share data with third parties except as required to provide the service\n• Parents can request complete deletion of all their child's data at any time by contacting support@myherokids.app\n• My Hero complies with COPPA (Children's Online Privacy Protection Act) and GDPR`,
  },
  {
    title: "4. Appropriate Use",
    body: `My Hero is designed for educational purposes only:\n\n• Parents are responsible for supervising their child's use of the application\n• The app includes a screen time limit feature — we strongly encourage parents to use it\n• We monitor AI conversations for safety purposes using automated systems\n• Parents will be alerted immediately if any concerning content is detected in conversations\n• You agree not to attempt to circumvent any safety systems in the app\n• Commercial use of any app content is strictly prohibited`,
  },
  {
    title: "5. AI-Powered Content",
    body: `My Hero uses advanced artificial intelligence (AI) to power Adam and Sara's responses:\n\n• While we work extremely hard to ensure accuracy and age-appropriateness, AI responses should be verified for critical academic work\n• AI can occasionally make mistakes — always encourage your child to verify important facts with teachers\n• We continuously improve our AI's educational quality and safety\n• The AI is designed to guide children to discover answers, not simply provide them — this is intentional and educationally proven\n• All AI conversations are subject to safety monitoring`,
  },
  {
    title: "6. Intellectual Property",
    body: `All content in My Hero — including Adam and Sara characters, stories, games, lesson content, and design — is owned by My Hero Education Ltd and protected by copyright. You may not reproduce, distribute, or create derivative works from any app content without written permission.`,
  },
  {
    title: "7. Limitation of Liability",
    body: `My Hero provides an educational service on an "as is" basis. While we strive for 100% uptime and accuracy, we cannot guarantee uninterrupted service. My Hero Education Ltd is not liable for any indirect, incidental, or consequential damages arising from use of the app.`,
  },
  {
    title: "8. Changes to Terms",
    body: `We may update these Terms from time to time. We will notify you of significant changes via email (using the address provided during registration) and within the app. Continued use after notification constitutes acceptance of the updated Terms.`,
  },
  {
    title: "9. Contact Us",
    body: `For any questions, concerns, data deletion requests, or support:\n\n📧 support@myherokids.app\n🌐 www.myherokids.app\n\nWe respond to all inquiries within 48 hours.`,
  },
];

const SECTIONS_AR = [
  {
    title: "١. المقدمة",
    body: `My Hero هو تطبيق تعليمي مصمم للأطفال من ٣ إلى ١٥ سنة، تديره شركة My Hero Education Ltd. باستخدامك لـ My Hero، أنت (ولي الأمر أو الوصي) توافق على هذه الشروط والأحكام نيابةً عنك وعن طفلك. يرجى قراءتها بعناية قبل استخدام التطبيق.`,
  },
  {
    title: "٢. الحساب والاشتراك",
    body: `يجب على الوالدين أو الأوصياء القانونيين إنشاء وإدارة حساب My Hero. لا يجوز للأطفال إنشاء حسابات بشكل مستقل.\n\n• الخطة الشهرية: 24.99$ شهرياً\n• خطة 6 أشهر: 135.99$ (وفّر 10%)\n• الخطة السنوية: 236.99$ سنوياً (وفّر 21%)\n• التجربة المجانية: 3 أيام — لا بطاقة بنكية مطلوبة\n• يمكن إلغاء الاشتراك في أي وقت من خلال إعدادات App Store أو Play Store\n• بعد الإلغاء، ستحتفظ بالوصول حتى نهاية فترة الفوترة\n• لا تُقدَّم استردادات للفترات الجزئية إلا حيثما يقتضي القانون`,
  },
  {
    title: "٣. خصوصية الأطفال",
    body: `نأخذ خصوصية طفلك بجدية بالغة:\n\n• نجمع فقط الحد الأدنى من المعلومات اللازمة لتقديم الخدمة (اسم الطفل، الفئة العمرية، بريد ولي الأمر للتقارير)\n• لا نبيع أي بيانات شخصية لأطراف ثالثة — أبداً\n• لا نعرض إعلانات للأطفال\n• يتم تخزين جميع البيانات بشكل آمن مع تشفير من الدرجة الصناعية\n• يمكن لولي الأمر طلب حذف جميع بيانات طفله في أي وقت عبر التواصل مع دعمنا\n• يلتزم My Hero بـ COPPA و GDPR`,
  },
  {
    title: "٤. الاستخدام المناسب",
    body: `My Hero مصمم للأغراض التعليمية فقط:\n\n• يتحمل الوالدان مسؤولية الإشراف على استخدام طفلهم للتطبيق\n• التطبيق يشمل ميزة تحديد وقت الشاشة — نشجّع الوالدين بشدة على استخدامها\n• نراقب محادثات الذكاء الاصطناعي لأغراض السلامة عبر أنظمة آلية\n• سيتم تنبيه الوالدين فوراً إذا اكتُشف أي محتوى مثير للقلق في المحادثات\n• تتفق على عدم محاولة التحايل على أي أنظمة أمان في التطبيق`,
  },
  {
    title: "٥. المحتوى المدعوم بالذكاء الاصطناعي",
    body: `يستخدم My Hero الذكاء الاصطناعي لتشغيل ردود آدم ولولو:\n\n• رغم حرصنا الشديد على الدقة والملاءمة العمرية، يجب التحقق من الردود للعمل الأكاديمي المهم\n• الذكاء الاصطناعي قد يخطئ أحياناً — شجّع طفلك دائماً على التحقق من الحقائق المهمة مع المعلمين\n• نواصل تحسين جودة وسلامة الذكاء الاصطناعي باستمرار\n• الذكاء الاصطناعي مصمم لتوجيه الأطفال لاكتشاف الإجابات، لا مجرد تقديمها — وهذا مقصود ومثبت تعليمياً`,
  },
  {
    title: "٦. الملكية الفكرية",
    body: `جميع محتويات My Hero — بما في ذلك شخصيتا آدم ولولو، القصص، الألعاب، محتوى الدروس، والتصميم — مملوكة لشركة My Hero Education Ltd ومحمية بحقوق النشر. لا يجوز إعادة إنتاج أو توزيع أو إنشاء أعمال مشتقة من أي محتوى دون إذن خطي.`,
  },
  {
    title: "٧. تحديد المسؤولية",
    body: `يقدم My Hero خدمة تعليمية "كما هي". بينما نسعى لتحقيق 100% من وقت التشغيل والدقة، لا يمكننا ضمان خدمة غير منقطعة. لا تتحمل شركة My Hero Education Ltd المسؤولية عن أي أضرار غير مباشرة أو عرضية أو تبعية ناجمة عن استخدام التطبيق.`,
  },
  {
    title: "٨. التغييرات على الشروط",
    body: `قد نحدّث هذه الشروط من وقت لآخر. سنخطرك بالتغييرات الجوهرية عبر البريد الإلكتروني (باستخدام العنوان المقدم عند التسجيل) وداخل التطبيق. الاستمرار في الاستخدام بعد الإخطار يُعد قبولاً للشروط المحدّثة.`,
  },
  {
    title: "٩. تواصل معنا",
    body: `لأي أسئلة، مخاوف، طلبات حذف البيانات، أو الدعم:\n\n📧 support@myherokids.app\n🌐 www.myherokids.app\n\nنرد على جميع الاستفسارات خلال ٤٨ ساعة.`,
  },
];

export default function TermsPage() {
  const c = useColors();
  const router = useRouter();
  const lang = useLang();
  const sections = lang === "ar" ? SECTIONS_AR : SECTIONS_EN;
  const isAr = lang === "ar";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 10 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.card, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="chevron-back" size={20} color={c.text} />
        </Pressable>
        <Text style={{ fontWeight: "900", fontSize: 20, color: c.text, flex: 1 }}>
          📋 {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>
        {/* Intro badge */}
        <View style={{ backgroundColor: "#EFF6FF", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#BFDBFE" }}>
          <Text style={{ color: "#1D4ED8", fontWeight: "700", fontSize: 13, lineHeight: 20, textAlign: isAr ? "right" : "left" }}>
            {isAr
              ? "🔒 My Hero ملتزم بأعلى معايير الخصوصية وأمان الأطفال. آخر تحديث: أبريل 2026"
              : "🔒 My Hero is committed to the highest standards of children's privacy and safety. Last updated: April 2026"}
          </Text>
        </View>

        {sections.map((sec, i) => (
          <View key={i} style={{ gap: 8 }}>
            <Text style={{ fontWeight: "800", fontSize: 16, color: c.text, textAlign: isAr ? "right" : "left" }}>
              {sec.title}
            </Text>
            <Text style={{ color: c.mutedForeground, fontSize: 14, lineHeight: 22, textAlign: isAr ? "right" : "left" }}>
              {sec.body}
            </Text>
            {i < sections.length - 1 && (
              <View style={{ height: 1, backgroundColor: c.muted, marginTop: 4 }} />
            )}
          </View>
        ))}

        {/* Footer */}
        <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, alignItems: "center", gap: 6 }}>
          <Text style={{ color: c.mutedForeground, fontSize: 12, textAlign: "center" }}>
            © 2026 My Hero Education Ltd. All rights reserved.
          </Text>
          <Text style={{ color: "#3B82F6", fontSize: 12, textAlign: "center" }}>support@myherokids.app</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
