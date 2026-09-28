/** Sign-in and registration copy per market (the pages themselves are client components). */

export type AuthLocale = "en-GB" | "pt-PT";

export const authCopy = {
  "en-GB": {
    backHome: "Back to home",
    shellTitle: "Verified healthcare staffing, built on trust",
    shellBody:
      "Join as a verified professional or create booking requests as a private client or organisation.",
    login: {
      title: "Sign in",
      intro: "Access your CareBridge Connect account — professionals, clients and organisations.",
      email: "Email",
      password: "Password",
      submit: "Sign in",
      submitting: "Signing in…",
      forgot: "Forgot password?",
      noAccount: "No account yet?",
      create: "Create an account",
    },
    register: {
      choiceTitle: "Get started with CareBridge Connect",
      tagline:
        "A trusted marketplace connecting families and organisations with verified healthcare and childcare professionals, making it easy to find safe, reliable, and high-quality care when it's needed most.",
      professionalCard: {
        title: "Join as a professional",
        description:
          "Complete eligibility screening, a competency assessment and document verification to join our verified marketplace.",
      },
      clientCard: {
        title: "Create a booking request",
        description:
          "Register as a private client or organisation to request verified nurses, HCAs, support workers or physiotherapists.",
      },
      forProfessionals: "For professionals",
      forClients: "For clients",
      continue: "Continue",
      alreadyRegistered: "Already registered?",
      signIn: "Sign in",
      checkEmail: "Check your email",
      sentBefore: "We've sent a confirmation link. Confirm your email, then ",
      sentLink: "sign in",
      allOptions: "All registration options",
      professionalIntro:
        "Create your account to begin eligibility screening, competency assessment and document verification.",
      clientIntro:
        "Create your account to request verified healthcare professionals by role, date and location.",
      registeringAs: "I am registering as…",
      privateClient: "Private client",
      privateClientHint: "Individual or family arranging care",
      organisation: "Organisation",
      organisationHint: "Care home, provider or healthcare organisation",
      fullName: "Full name",
      email: "Email",
      password: "Password",
      accept: "I accept the",
      terms: "Terms",
      and: "and",
      privacy: "Privacy Policy",
      creating: "Creating…",
      create: "Create account",
      needCare: "Need to request care instead?",
      areProfessional: "Are you a healthcare professional?",
      joinProfessional: "Join as a professional",
      createBooking: "Create a booking request",
    },
  },
  "pt-PT": {
    backHome: "Voltar ao início",
    shellTitle: "Profissionais de saúde verificados, com confiança",
    shellBody:
      "Junte-se como profissional verificado ou crie pedidos de marcação como cliente particular ou organização.",
    login: {
      title: "Entrar",
      intro: "Aceda à sua conta CareBridge Connect — profissionais, clientes e organizações.",
      email: "Email",
      password: "Palavra-passe",
      submit: "Entrar",
      submitting: "A entrar…",
      forgot: "Esqueceu-se da palavra-passe?",
      noAccount: "Ainda não tem conta?",
      create: "Criar uma conta",
    },
    register: {
      choiceTitle: "Comece na CareBridge Connect",
      tagline:
        "Um marketplace de confiança que liga famílias e organizações a profissionais de saúde e de cuidados infantis verificados, para encontrar apoio seguro, fiável e de qualidade quando mais é preciso.",
      professionalCard: {
        title: "Junte-se como profissional",
        description:
          "Conclua a triagem de elegibilidade, a avaliação de competências e a verificação de documentos para se juntar ao nosso marketplace verificado.",
      },
      clientCard: {
        title: "Criar um pedido de marcação",
        description:
          "Registe-se como cliente particular ou organização para pedir enfermeiros, auxiliares de saúde, cuidadores infantis ou fisioterapeutas verificados.",
      },
      forProfessionals: "Para profissionais",
      forClients: "Para clientes",
      continue: "Continuar",
      alreadyRegistered: "Já tem registo?",
      signIn: "Entrar",
      checkEmail: "Verifique o seu email",
      sentBefore: "Enviámos uma ligação de confirmação. Confirme o seu email e depois ",
      sentLink: "entre",
      allOptions: "Todas as opções de registo",
      professionalIntro:
        "Crie a sua conta para iniciar a triagem de elegibilidade, a avaliação de competências e a verificação de documentos.",
      clientIntro:
        "Crie a sua conta para pedir profissionais de saúde verificados por função, data e local.",
      registeringAs: "Estou a registar-me como…",
      privateClient: "Cliente particular",
      privateClientHint: "Pessoa ou família que organiza cuidados",
      organisation: "Organização",
      organisationHint: "Lar, prestador ou organização de saúde",
      fullName: "Nome completo",
      email: "Email",
      password: "Palavra-passe",
      accept: "Aceito os",
      terms: "Termos",
      and: "e a",
      privacy: "Política de Privacidade",
      creating: "A criar…",
      create: "Criar conta",
      needCare: "Precisa antes de pedir cuidados?",
      areProfessional: "É um profissional de saúde?",
      joinProfessional: "Junte-se como profissional",
      createBooking: "Criar um pedido de marcação",
    },
  },
} as const;

type Widen<T> = T extends string ? string : { -readonly [K in keyof T]: Widen<T[K]> };

/** Both languages must have every string: this line fails to compile if one is missing. */
export type AuthCopy = Widen<(typeof authCopy)["en-GB"]>;
const _parity: Record<AuthLocale, AuthCopy> = authCopy;
void _parity;
