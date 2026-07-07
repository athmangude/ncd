// Member FAQ content, sourced from jireh-health.com/faqs and presented in-app so
// it matches the app's styling instead of opening the marketing site.

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqCategory {
  id: string
  title: string
  items: FaqItem[]
}

export const memberFaqs: FaqCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    items: [
      {
        question: "What is Jireh Health?",
        answer:
          "Jireh Health is a healthcare payment platform that makes it easier and more affordable to pay for medical care. You can pay hospitals, clinics, labs, and pharmacies directly through the app, with zero transaction fees, cashback rewards, exclusive discounts and access to Pay Over Time with zero interest when you need it.",
      },
      {
        question: "How do I create an account?",
        answer:
          "Access the Jireh Health app at app.jireh-health.com, sign up for free with your phone number & ID number, and you're ready to go. You'll have immediate access to payments, cashbacks, discounts, and your Circle benefits.",
      },
      {
        question: "What's the difference between Jireh Basic and Jireh Plus?",
        answer:
          "Jireh Basic is our free Plan that gives you access to payments, cashbacks, discounts and Circle benefits. Jireh Plus is an upgraded version that gives you everything in Basic plus access to our zero interest Lipa Baadaye product, which allows you to get care now and pay later. Jireh Plus members also enjoy premium customer care. To upgrade to Jireh Plus, you will pay a one-time fee of only KES 499.",
      },
      {
        question: "Which facilities can I pay through Jireh Health?",
        answer:
          "You can pay at any of our partner hospitals, clinics, labs, & pharmacies and any other licensed healthcare facility in Kenya. The list of partner facilities is available on the app. We're constantly adding new partners to make sure care is accessible near you.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    items: [
      {
        question: "Are there any charges when I make a payment?",
        answer:
          "No. Jireh Health charges zero transaction fees. Every shilling you pay goes directly toward your care, nothing is deducted for processing.",
      },
      {
        question: "Can I pay for someone else's medical bill?",
        answer:
          "Yes. Through your Circle, you can pay medical bills for your loved ones directly from your Jireh Health account. You can also share cashbacks and use your zero interest Lipa Baadaye on their behalf.",
      },
      {
        question: "Is my payment secure?",
        answer:
          "Absolutely. All payments are processed securely. Your financial information is never shared with third parties.",
      },
    ],
  },
  {
    id: "discounts-cashbacks",
    title: "Discounts & Cashbacks",
    items: [
      {
        question: "How do cashbacks work?",
        answer:
          "Every time you make a payment through Jireh Health at any of our partner facilities, you earn back up to 5% of the payment amount. This builds up in your Jireh Health account and can be used to reduce future medical bills or to help pay for a loved one's bill.",
      },
      {
        question: "Where can I use my discounts?",
        answer:
          "Discounts are occasionally and exclusively available at our partner facilities. You'll see some displayed in the app or we will send you an SMS notifying you when they are available. Some discounts are automatically applied as you make payment while others come in the form of a discount voucher at checkout.",
      },
      {
        question: "Does my cashback expire?",
        answer:
          "Your cashback is tied to your Jireh Health account and doesn't expire while your account is active. You can always check your balance on your app dashboard so you know what's available to use.",
      },
    ],
  },
  {
    id: "jireh-plus",
    title: "Jireh Plus",
    items: [
      {
        question: "What is Jireh Plus?",
        answer:
          "Jireh Plus gives you access to our Lipa Baadaye feature, allowing you to pay over time at zero interest. Lipa Badaaye means “pay later” in Swahili. If you don't have enough money to cover a medical bill, Jireh Health can cover it for you and you repay over time with no added interest or hidden charges.",
      },
      {
        question: "How do I qualify for Jireh Plus?",
        answer:
          "To access Jireh Plus, you need to complete three steps: upload a valid national ID, add at least 2 adult members to your Circle that complete sign up, and upload your M-Pesa statements for the last 6 months. Once verified in real time, you'll receive an initial credit limit of up to KES 6,000.",
      },
      {
        question: "Can my credit limit increase over time?",
        answer:
          "Yes. Your limit starts at up to KES 6,000 and grows as you build a repayment history. The more consistently you repay, the higher your limit can go.",
      },
      {
        question: "Is there really no interest charged?",
        answer:
          "Yes. Jireh Plus is completely interest-free. You repay exactly what was spent on your care, nothing more. No hidden fees.",
      },
      {
        question: "What happens if I don't pay back?",
        answer:
          "In the unfortunate event that this happens, you will be charged penalties and your Circle will be notified (not to shame you but you see how best they can help you). If this still leads to non-repayment, your account will be blocked and reported to CRB.",
      },
    ],
  },
  {
    id: "your-circle",
    title: "Your Circle",
    items: [
      {
        question: "What is Your Circle?",
        answer:
          "Your Circle lets you connect with your loved ones, family members, parents, children, a partner, and/or friends so you can support each other's healthcare needs. Within your Circle, you can share cashback, help pay each other's bills and use Lipa Baadaye for one another.",
      },
      {
        question: "How many people can I add to my Circle?",
        answer:
          "You can add multiple loved ones to your Circle. For Jireh Plus eligibility, you need at least 2 adult members. Each member manages their own account while sharing the benefits of your Circle.",
      },
      {
        question:
          "What happens if a Circle member can't repay their Lipa Baadaye?",
        answer:
          "If a member is struggling to repay, other Circle members will be gently notified and given the option to help. This is a nudge, not a forced charge. The spirit of the Circle is mutual support, and we handle these situations with care and understanding.",
      },
    ],
  },
  {
    id: "privacy-security",
    title: "Privacy & Security",
    items: [
      {
        question: "How is my personal data protected?",
        answer:
          "We take data protection seriously which is why we work with the Office of the Data Protection Commissioner (ODPC). Your data is encrypted, securely stored, and never sold or shared with advertisers. We only use your information to provide our services. You can contact us at any time to request access to or deletion of your data.",
      },
      {
        question: "Why do you ask for M-Pesa statements?",
        answer:
          "M-Pesa statements help us assess your eligibility for Jireh Plus in a fair, responsible way, without requiring a credit card or formal bank account. Your statements are used only for this purpose and handled with strict confidentiality.",
      },
      {
        question:
          "What if I suspect unauthorized access on my Jireh Health account?",
        answer:
          "Contact our support team immediately. We can lock your account and help you recover access safely. Never share your PIN or OTP with anyone, including anyone claiming to be from Jireh Health.",
      },
    ],
  },
]
