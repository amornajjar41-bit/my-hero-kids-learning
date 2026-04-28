import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SoftCard } from "@/components/SoftCard";
import { useColors } from "@/hooks/useColors";
import { useLang } from "@/hooks/useT";

export default function PrivacyPolicy() {
  const c = useColors();
  const router = useRouter();
  const lang = useLang();
  const isAr = lang === "ar";

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <SoftCard style={{ gap: 10 }}>
      <Text style={{ fontWeight: "800", fontSize: 16, color: c.text, textAlign: isAr ? "right" : "left" }}>
        {title}
      </Text>
      {children}
    </SoftCard>
  );

  const P = ({ text }: { text: string }) => (
    <Text style={{ color: c.mutedForeground, fontSize: 14, lineHeight: 22, textAlign: isAr ? "right" : "left" }}>
      {text}
    </Text>
  );

  const Bullet = ({ text }: { text: string }) => (
    <View style={{ flexDirection: isAr ? "row-reverse" : "row", gap: 10, alignItems: "flex-start" }}>
      <Text style={{ color: c.primary, fontWeight: "800", marginTop: 3 }}>•</Text>
      <Text style={{ flex: 1, color: c.mutedForeground, fontSize: 14, lineHeight: 22, textAlign: isAr ? "right" : "left" }}>
        {text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <View style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: c.card, alignItems: "center", justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </Pressable>
        <Text style={{ fontWeight: "800", fontSize: 20, color: c.text, flex: 1 }}>
          🔒 {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, gap: 14, paddingBottom: 60 }}>

        {/* Title */}
        <View style={{ gap: 4 }}>
          <Text style={{ fontWeight: "900", fontSize: 22, color: c.text, textAlign: isAr ? "right" : "left" }}>
            {isAr ? "سياسة الخصوصية — تطبيق My Hero" : "Privacy Policy — My Hero App"}
          </Text>
          <Text style={{ color: c.mutedForeground, fontSize: 13, textAlign: isAr ? "right" : "left" }}>
            {isAr ? "آخر تحديث: أبريل ٢٠٢٦" : "Last updated: April 2026"}
          </Text>
        </View>

        {/* Section 1 */}
        <Section title={isAr ? "١. ما الذي نجمعه" : "1. What We Collect"}>
          <P text={isAr
            ? "نجمع فقط المعلومات الضرورية لتوفير تجربة تعليمية شخصية:"
            : "We collect only the information necessary to provide a personalized learning experience:"} />
          {isAr ? (
            <>
              <Bullet text="اسم الطفل، عمره، وجنسه" />
              <Bullet text="تقدم التعلم وأداء الدروس" />
              <Bullet text="أسئلة الواجبات المنزلية للرد عليها" />
              <Bullet text="بريد الوالد الإلكتروني واسمه — لإرسال تقارير التقدم" />
              <Bullet text="لا نجمع أي بيانات حساسة أو معلومات شخصية زائدة عن الحاجة" />
            </>
          ) : (
            <>
              <Bullet text="Child name, age, and gender" />
              <Bullet text="Learning progress and lesson performance" />
              <Bullet text="Homework questions to provide answers" />
              <Bullet text="Parent email and name — to send progress reports" />
              <Bullet text="We never collect sensitive personal data or any information beyond what is needed" />
            </>
          )}
        </Section>

        {/* Section 2 */}
        <Section title={isAr ? "٢. ما لا نفعله أبداً" : "2. What We Never Do"}>
          {isAr ? (
            <>
              <Bullet text="لا نبيع بيانات طفلك أو والده أبداً" />
              <Bullet text="لا نعرض أي إعلانات على الإطلاق" />
              <Bullet text="لا نشارك البيانات مع أي طرف ثالث لأغراض تجارية" />
              <Bullet text="لا نستخدم البيانات إلا لتحسين تجربة تعلم طفلك" />
            </>
          ) : (
            <>
              <Bullet text="We never sell your child's or your data to anyone" />
              <Bullet text="We never show ads of any kind" />
              <Bullet text="We never share data with third parties for commercial purposes" />
              <Bullet text="Data is used only to improve your child's learning experience" />
            </>
          )}
        </Section>

        {/* Section 3 */}
        <Section title={isAr ? "٣. سلامة الأطفال" : "3. Children's Safety"}>
          <P text={isAr
            ? "سلامة طفلك أولويتنا القصوى:"
            : "Your child's safety is our highest priority:"} />
          {isAr ? (
            <>
              <Bullet text="جميع المحادثات مراقبة بنظام كشف تلقائي للمحتوى غير المناسب" />
              <Bullet text="يتم تنبيه الوالدين فوراً عند اكتشاف أي محتوى مقلق" />
              <Bullet text="النظام مصمم حصرياً للأطفال من ٣ إلى ١٥ سنة" />
              <Bullet text="لا يستطيع الطفل مشاركة معلومات شخصية عبر الدردشة" />
            </>
          ) : (
            <>
              <Bullet text="All conversations are monitored by an automatic safety detection system" />
              <Bullet text="Parents are alerted immediately to any concerning content" />
              <Bullet text="The system is designed exclusively for children ages 3–15" />
              <Bullet text="Children cannot share personal information through the chat" />
            </>
          )}
        </Section>

        {/* Section 4 */}
        <Section title={isAr ? "٤. تخزين البيانات" : "4. Data Storage"}>
          <P text={isAr
            ? "جميع البيانات مشفرة ومخزنة بشكل آمن على خوادم محمية. نستخدم بروتوكولات تشفير عالية المستوى لحماية معلوماتك."
            : "All data is encrypted and stored securely on protected servers. We use industry-standard encryption protocols to protect your information."} />
        </Section>

        {/* Section 5 */}
        <Section title={isAr ? "٥. حقوق الوالدين" : "5. Parent Rights"}>
          {isAr ? (
            <>
              <Bullet text="يمكنك طلب حذف جميع بياناتك ومتعلقاتها في أي وقت" />
              <Bullet text="يمكنك الاطلاع على جميع البيانات المخزنة المتعلقة بطفلك" />
              <Bullet text="يمكنك إلغاء اشتراكك في أي وقت دون غرامات" />
              <P text="لطلب حذف البيانات، راسلنا على:" />
            </>
          ) : (
            <>
              <Bullet text="You can request complete deletion of all your data at any time" />
              <Bullet text="You can request to view all stored data related to your child" />
              <Bullet text="You can cancel your subscription at any time with no penalties" />
              <P text="To request data deletion, email us at:" />
            </>
          )}
          <Pressable>
            <Text style={{ color: c.primary, fontWeight: "700", fontSize: 14, textAlign: isAr ? "right" : "left" }}>
              support@myheroapp.com
            </Text>
          </Pressable>
        </Section>

        {/* Section 6 */}
        <Section title={isAr ? "٦. تواصل معنا" : "6. Contact Us"}>
          <P text={isAr
            ? "إذا كان لديك أي سؤال أو قلق حول خصوصية بيانات طفلك، يرجى التواصل معنا:"
            : "If you have any questions or concerns about your child's data privacy, please reach out to us:"} />
          <Text style={{ color: c.primary, fontWeight: "700", fontSize: 14, textAlign: isAr ? "right" : "left" }}>
            support@myheroapp.com
          </Text>
          <P text={isAr
            ? "نرد خلال ٢٤ ساعة في أيام العمل."
            : "We respond within 24 hours on business days."} />
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}
