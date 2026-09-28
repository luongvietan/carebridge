/**
 * European Portuguese FAQ, mirroring `faqs.ts` question for question. The
 * content is Portuguese, not a translation of the UK's: the regulators and
 * documents differ (Ordem dos Enfermeiros, Segurança Social, Registo Criminal),
 * and nothing here claims a regulatory status the company has not confirmed.
 */
export const faqsPt = [
  {
    question: "A CareBridge Connect é um prestador de cuidados registado?",
    answer:
      "Não. A CareBridge Connect é um marketplace que liga famílias, clientes particulares e organizações a profissionais verificados. Não presta diretamente cuidados de saúde nem de infância: quem presta o serviço é o profissional que aceita a marcação.",
  },
  {
    question: "A CareBridge Connect é um serviço de emergência?",
    answer:
      "Não. Em caso de emergência ligue 112 ou dirija-se ao serviço de urgência mais próximo.",
  },
  {
    question: "Como são verificados os profissionais?",
    answer:
      "Todos os profissionais passam por uma triagem de elegibilidade, uma avaliação de competências online e o envio de documentos. A equipa CareBridge Connect analisa a identidade, o NIF, o comprovativo de morada, o direito de residência e de trabalho, o registo criminal, a cédula profissional (quando aplicável), seguro, formação obrigatória e referências antes da aprovação. Ninguém pode aceitar uma marcação enquanto essa análise não estiver concluída.",
  },
  {
    question: "Como são verificados os profissionais de cuidados infantis?",
    answer:
      "Os profissionais de infância são verificados com o mesmo rigor dos de saúde, com requisitos adicionais: o registo criminal emitido para funções com menores, um certificado de primeiros socorros em vigor e, no caso das amas, a autorização da Segurança Social (ISS). Estes documentos são verificados antes de qualquer marcação poder ser aceite.",
  },
  {
    question: "O que acontece se um documento expirar?",
    answer:
      "A plataforma impede automaticamente o profissional de aceitar novas marcações quando um documento crítico caduca — por exemplo o registo criminal, a cédula profissional, o seguro, a formação ou a autorização de residência. Só volta a poder aceitar marcações depois de enviar os documentos atualizados e de estes serem aprovados.",
  },
  {
    question: "Como funcionam os pedidos de marcação?",
    answer:
      "Clientes particulares e organizações criam um pedido indicando a função pretendida, a data, o horário, a duração e o local. Os profissionais verificados podem aceitar marcações abertas, ou um administrador pode atribuir diretamente um profissional que cumpra os requisitos.",
  },
  {
    question: "Existe uma avaliação de competências?",
    answer:
      "Sim. Todos os profissionais têm de concluir uma avaliação online que abrange segurança e proteção, prevenção de infeção, proteção de dados, noções de medicação e conhecimentos específicos da função. A nota mínima é 80%, com um máximo de três tentativas. Após três falhas, novas tentativas ficam bloqueadas durante um período de revisão.",
  },
  {
    question: "Como são tratados os pagamentos?",
    answer:
      "O pagamento do cliente é cobrado de forma segura através do Stripe quando a marcação é confirmada. O pagamento ao profissional só é libertado depois de as horas efetivamente trabalhadas serem registadas e confirmadas. Em Portugal os valores são apresentados e cobrados em euros.",
  },
  {
    question: "Podemos exportar os nossos dados?",
    answer:
      "Sim. A CareBridge Connect pode exportar todos os dados da plataforma a qualquer momento — perfis de profissionais, clientes e organizações, marcações, registos de conformidade, resultados de avaliações e pagamentos — em formato CSV ou Excel (XLSX).",
  },
] as const;
