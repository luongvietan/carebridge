/**
 * Portuguese legal documents — DRAFTS for review by a lawyer in Portugal.
 *
 * Written for the Portuguese market rather than translated from the UK texts:
 * RGPD and Lei n.º 58/2019 instead of UK GDPR, CNPD instead of the ICO, the
 * Livro de Reclamações and consumer dispute resolution, trabalhador independente
 * status (Finanças / Segurança Social), registo criminal, Ordens and ISS, and
 * Portuguese law and courts. Ana asked (5 October) for them to go up as drafts
 * while her lawyer reviews them; every page shows `LEGAL_DRAFT_NOTICE_PT`.
 *
 * Square-bracket placeholders ([denominação social], [NIPC], [morada]) are the
 * Portuguese company's details, which Ana has not yet sent.
 */
import type { LegalSection } from "@/data/legal-copy";

export const LEGAL_DRAFT_NOTICE_PT =
  "Versão provisória para revisão jurídica. Este documento ainda está a ser revisto por um advogado em Portugal e pode ser alterado antes do lançamento do serviço.";

const COMPANY =
  "[denominação social], pessoa coletiva n.º [NIPC], com sede em [morada] (“CareBridge Connect”)";

export const termsIndexPt = {
  title: "Termos e Condições",
  intro:
    "A CareBridge Connect tem termos próprios para clientes e organizações e para profissionais. Selecione o documento que se aplica a si.",
  readDocument: "Ler documento",
  allTerms: "Todos os termos e condições",
  links: [
    {
      href: "/terms/clients",
      title: "Termos e Condições para Clientes",
      description:
        "Aplicam-se a famílias, clientes particulares e organizações que solicitam profissionais através da plataforma.",
    },
    {
      href: "/terms/professionals",
      title: "Termos e Condições para Profissionais",
      description:
        "Aplicam-se aos profissionais independentes de saúde, de apoio domiciliário e de cuidados infantis registados na plataforma.",
    },
  ],
} as const;

export const clientTermsPt: { title: string; sections: readonly LegalSection[] } = {
  title: "CareBridge Connect – Termos e Condições para Clientes",
  sections: [
    {
      title: "1. Identificação e âmbito",
      paragraphs: [
        `A plataforma CareBridge Connect é explorada em Portugal por ${COMPANY}.`,
        "Estes Termos e Condições regulam a utilização da plataforma por famílias, clientes particulares e organizações que procuram profissionais de saúde, de apoio domiciliário e de cuidados infantis.",
        "Ao criar uma conta ou utilizar a plataforma, declara que leu e aceita estes Termos e Condições e a Política de Privacidade.",
      ],
    },
    {
      title: "2. O que é a CareBridge Connect",
      paragraphs: [
        "A CareBridge Connect é um marketplace que liga clientes e organizações a profissionais independentes previamente verificados.",
        "A CareBridge Connect não presta diretamente cuidados de saúde, atos de enfermagem, tratamentos, cuidados pessoais ou serviços de apoio social, não é um prestador de cuidados de saúde registado na Entidade Reguladora da Saúde (ERS) nem um estabelecimento de apoio social licenciado pelo Instituto da Segurança Social (ISS). O serviço é prestado pelo profissional que aceita a marcação, na sua própria capacidade profissional.",
        "A CareBridge Connect não é um serviço de emergência. Em caso de emergência, ligue 112.",
      ],
    },
    {
      title: "3. Conta e informação prestada",
      bullets: [
        "Deve ter pelo menos 18 anos e capacidade para contratar.",
        "A informação que nos dá — incluindo a morada do serviço e as necessidades da pessoa apoiada — deve ser verdadeira, completa e mantida atualizada.",
        "É responsável pela confidencialidade das suas credenciais de acesso e por toda a atividade feita na sua conta.",
        "As organizações garantem que quem utiliza a conta tem poderes para as representar.",
      ],
    },
    {
      title: "4. Obrigações do cliente",
      intro: "O cliente compromete-se a:",
      bullets: [
        "Tratar os profissionais com dignidade e respeito.",
        "Proporcionar condições de trabalho seguras.",
        "Comunicar a informação relevante para que o profissional possa prestar o serviço em segurança, incluindo riscos conhecidos.",
        "Não solicitar ao profissional atos que excedam a sua qualificação ou o âmbito da sua atividade.",
        "Cumprir a legislação aplicável.",
      ],
    },
    {
      title: "5. Marcações, preços e pagamentos",
      bullets: [
        "Todas as marcações devem ser feitas e pagas através da plataforma.",
        "Os preços são apresentados em euros antes da confirmação da marcação e incluem os impostos aplicáveis.",
        "O pagamento é cobrado quando a marcação é atribuída a um profissional, através do prestador de pagamentos Stripe (cartão, MB WAY ou Multibanco, conforme disponível). A CareBridge Connect não guarda os dados do seu cartão.",
        "O valor pago ao profissional só é libertado depois de as horas efetivamente prestadas serem confirmadas pelo cliente. Se o cliente não responder no prazo de três dias úteis, as horas consideram-se confirmadas, salvo se tiver apresentado uma reclamação sobre essas horas.",
        "A CareBridge Connect pode cobrar uma comissão pela utilização da plataforma, incluída no preço apresentado.",
      ],
    },
    {
      title: "6. Cancelamentos",
      paragraphs: [
        "Pode cancelar uma marcação através da plataforma. Os cancelamentos com menos de 24 horas de antecedência são assinalados como cancelamentos de última hora e podem implicar o pagamento de uma taxa, de acordo com a política de cancelamento apresentada na plataforma no momento da marcação.",
      ],
    },
    {
      title: "7. Direito de livre resolução (consumidores)",
      paragraphs: [
        "Se for consumidor, tem o direito de resolver o contrato celebrado à distância no prazo de 14 dias, nos termos do Decreto-Lei n.º 24/2014, de 14 de fevereiro.",
        "Se pedir expressamente que o serviço comece antes do fim desse prazo, perde o direito de livre resolução quando o serviço estiver integralmente prestado e, se resolver o contrato antes disso, paga o valor proporcional ao serviço já prestado.",
      ],
    },
    {
      title: "8. Relação com os profissionais",
      paragraphs: [
        "Os profissionais são trabalhadores independentes. Não são trabalhadores, agentes ou representantes da CareBridge Connect, que não dirige nem controla a forma como prestam o serviço.",
        "A CareBridge Connect verifica, antes da aprovação e de forma contínua, a identidade, o direito de trabalhar em Portugal, o registo criminal, a inscrição profissional (Ordem dos Enfermeiros, Ordem dos Fisioterapeutas ou autorização do ISS, conforme a categoria), os seguros e as referências dos profissionais. Essa verificação não substitui a responsabilidade própria de cada profissional.",
      ],
    },
    {
      title: "9. Reclamações, incidentes e proteção de pessoas vulneráveis",
      paragraphs: [
        "Comunique-nos de imediato, através da plataforma, qualquer incidente, reclamação ou preocupação com a segurança de uma criança ou de um adulto vulnerável. Em situação de perigo imediato, ligue 112. Situações de perigo para crianças podem também ser comunicadas à Comissão de Proteção de Crianças e Jovens (CPCJ) da área.",
        "Dispõe do Livro de Reclamações Eletrónico, em www.livroreclamacoes.pt.",
        "Em caso de litígio de consumo, pode recorrer a uma entidade de resolução alternativa de litígios de consumo; a lista está disponível no Portal do Consumidor (www.consumidor.gov.pt). [Entidade RAL a indicar.]",
      ],
    },
    {
      title: "10. Responsabilidade",
      paragraphs: [
        "A CareBridge Connect responde pelo funcionamento da plataforma e pela verificação que se compromete a fazer. Não responde pelos atos ou omissões dos profissionais independentes na prestação do serviço, sem prejuízo dos direitos que a lei lhe reconhece enquanto consumidor.",
        "Nada nestes termos exclui ou limita a responsabilidade da CareBridge Connect por dolo ou culpa grave, nem qualquer responsabilidade que a lei não permita excluir.",
      ],
    },
    {
      title: "11. Suspensão e encerramento da conta",
      paragraphs: [
        "A CareBridge Connect pode suspender ou encerrar uma conta em caso de incumprimento destes termos, de utilização fraudulenta ou de risco para a segurança de profissionais ou de terceiros. Pode encerrar a sua conta a qualquer momento, sem prejuízo das marcações já pagas.",
      ],
    },
    {
      title: "12. Dados pessoais",
      paragraphs: [
        "Os seus dados pessoais são tratados nos termos da nossa Política de Privacidade.",
      ],
    },
    {
      title: "13. Alterações, lei aplicável e foro",
      paragraphs: [
        "Podemos alterar estes termos, avisando-o com antecedência razoável. As alterações não se aplicam a marcações já confirmadas.",
        "Estes termos regem-se pela lei portuguesa. Para litígios com consumidores é competente o tribunal do domicílio do consumidor; nos restantes casos, o tribunal da comarca de [comarca].",
      ],
    },
  ],
};

export const professionalTermsPt: { title: string; sections: readonly LegalSection[] } = {
  title: "CareBridge Connect – Termos e Condições para Profissionais",
  sections: [
    {
      title: "1. Identificação e âmbito",
      paragraphs: [
        `A plataforma CareBridge Connect é explorada em Portugal por ${COMPANY}.`,
        "Estes Termos e Condições regulam a utilização da plataforma por profissionais independentes de saúde, de apoio domiciliário e de cuidados infantis.",
        "A segurança e o bem-estar dos clientes, dos profissionais e da comunidade são a prioridade da CareBridge Connect.",
      ],
    },
    {
      title: "2. Estatuto de trabalhador independente",
      paragraphs: [
        "O profissional exerce a sua atividade como trabalhador independente, com atividade aberta nas Finanças. Não existe contrato de trabalho com a CareBridge Connect, nem qualquer relação de subordinação: o profissional decide livremente que marcações aceita e organiza a forma como presta o serviço.",
        "O profissional é responsável pelas suas obrigações fiscais (IRS e, quando aplicável, IVA), pela emissão dos documentos fiscais exigidos por lei, pelas contribuições para a Segurança Social, pelos seus seguros e pelas suas inscrições profissionais.",
      ],
    },
    {
      title: "3. Requisitos para ser aprovado",
      intro: "Antes da aprovação, e enquanto utilizar a plataforma, o profissional deve:",
      bullets: [
        "Ter documento de identificação válido e direito de trabalhar em Portugal.",
        "Indicar o NIF e o NISS e comprovar a abertura de atividade nas Finanças.",
        "Apresentar certificado de registo criminal português válido e, quando tenha residido recentemente noutros países, o certificado desses países. Nas categorias de cuidados infantis, o certificado deve ser emitido para o exercício de funções que envolvam contacto regular com menores, nos termos da Lei n.º 113/2009.",
        "Ter inscrição ativa na ordem profissional competente (Ordem dos Enfermeiros ou Ordem dos Fisioterapeutas) e, no caso das Amas, autorização do Instituto da Segurança Social.",
        "Ter seguro de responsabilidade civil profissional e seguro de acidentes de trabalho para trabalhadores independentes.",
        "Apresentar as qualificações, o currículo e as referências solicitadas.",
        "Obter pelo menos 80% na avaliação de competências da CareBridge Connect.",
        "Informar de imediato a CareBridge Connect de qualquer alteração que possa afetar a sua aptidão para prestar o serviço.",
      ],
    },
    {
      title: "4. Validade dos documentos",
      paragraphs: [
        "Os documentos com prazo de validade são acompanhados pela plataforma. O profissional é avisado antes de expirarem; quando um documento obrigatório expira, o profissional deixa automaticamente de poder aceitar novas marcações até apresentar um documento válido e este ser aprovado.",
      ],
    },
    {
      title: "5. Conduta profissional",
      intro: "O profissional compromete-se a:",
      bullets: [
        "Colocar sempre em primeiro lugar a segurança, o bem-estar, a dignidade e os direitos das pessoas a quem presta o serviço.",
        "Trabalhar dentro da sua competência, qualificação e âmbito de atividade — em particular, os profissionais de apoio domiciliário e de cuidados infantis não praticam atos reservados a profissionais de saúde.",
        "Cumprir as normas deontológicas da sua profissão e a legislação aplicável.",
        "Manter os limites profissionais adequados e não contratar diretamente, fora da plataforma, clientes que conheceu através dela.",
        "Guardar sigilo sobre a informação a que tenha acesso.",
      ],
    },
    {
      title: "6. Verificação pela plataforma",
      paragraphs: [
        "A CareBridge Connect pode fazer verificações, pedir documentos adicionais, repetir a avaliação de competências e recusar, suspender ou retirar a aprovação sempre que tenha dúvidas fundadas sobre a aptidão do profissional. A inscrição profissional é reverificada pelo menos uma vez por ano.",
      ],
    },
    {
      title: "7. Marcações, horas e pagamentos",
      bullets: [
        "O profissional só deve aceitar marcações que consiga cumprir com segurança, competência e pontualidade.",
        "No fim de cada serviço, o profissional regista na plataforma as horas efetivamente prestadas.",
        "O pagamento é libertado depois de o cliente confirmar as horas, ou automaticamente três dias úteis depois do registo se o cliente não responder e não houver reclamação pendente.",
        "Os pagamentos são feitos por transferência SEPA para o IBAN indicado pelo profissional, deduzida a comissão da plataforma apresentada antes da aceitação da marcação.",
      ],
    },
    {
      title: "8. Segurança e proteção de pessoas vulneráveis",
      intro: "O profissional deve:",
      bullets: [
        "Tomar todas as medidas razoáveis para proteger a saúde e a segurança das pessoas a quem presta o serviço.",
        "Comunicar de imediato à CareBridge Connect, através da plataforma, qualquer incidente, acidente, quase-acidente, reclamação ou preocupação com uma criança ou um adulto vulnerável.",
        "Em situação de perigo imediato, ligar 112; situações de perigo para crianças podem também ser comunicadas à CPCJ da área.",
        "Colaborar com qualquer averiguação da CareBridge Connect ou das autoridades competentes.",
      ],
    },
    {
      title: "9. Cancelamentos e fiabilidade",
      intro:
        "O profissional deve cumprir as marcações que aceita. Cancelamentos repetidos, faltas, conduta imprópria, prática insegura, incumprimento ou desonestidade podem levar a:",
      bullets: [
        "Suspensão temporária",
        "Restrição do acesso a marcações",
        "Remoção da plataforma",
        "Encerramento da conta",
      ],
    },
    {
      title: "10. Seguros",
      paragraphs: [
        "O profissional mantém, durante todo o período em que utiliza a plataforma, os seguros exigidos para a sua categoria, e apresenta as respetivas apólices sempre que lhe forem pedidas.",
      ],
    },
    {
      title: "11. Suspensão e encerramento",
      paragraphs: [
        "A CareBridge Connect pode suspender, restringir, averiguar ou encerrar o acesso à plataforma por razões de segurança, proteção de pessoas vulneráveis, conduta profissional, conformidade, fiabilidade, fraude ou incumprimento destes termos. A suspensão pode ser imediata quando exista risco para clientes ou terceiros. O profissional é informado do motivo e pode pronunciar-se.",
      ],
    },
    {
      title: "12. Confidencialidade e propriedade intelectual",
      paragraphs: [
        "O profissional não divulga nem utiliza para outros fins a informação de clientes, organizações ou da CareBridge Connect a que tenha acesso, salvo quando a lei o exija ou seja necessário para proteger a segurança de alguém.",
        "Os conteúdos, a marca, os sistemas e os materiais da plataforma pertencem à CareBridge Connect.",
      ],
    },
    {
      title: "13. Dados pessoais",
      paragraphs: [
        "Os dados do profissional são tratados nos termos da Política de Privacidade. O profissional trata os dados pessoais dos clientes a que tenha acesso de acordo com o Regulamento Geral sobre a Proteção de Dados (RGPD) e a Lei n.º 58/2019, apenas para prestar o serviço marcado.",
      ],
    },
    {
      title: "14. Alterações, lei aplicável e foro",
      paragraphs: [
        "A CareBridge Connect pode alterar estes termos, avisando o profissional com antecedência razoável.",
        "Estes termos regem-se pela lei portuguesa. Para qualquer litígio é competente o tribunal da comarca de [comarca].",
      ],
    },
  ],
};

export const privacyPolicyPt: { title: string; sections: readonly LegalSection[] } = {
  title: "Política de Privacidade",
  sections: [
    {
      title: "1. Responsável pelo tratamento",
      paragraphs: [
        `O responsável pelo tratamento dos seus dados pessoais é ${COMPANY}. Para qualquer questão sobre os seus dados, contacte-nos através do email indicado no rodapé do site.`,
        "Tratamos os dados pessoais de acordo com o Regulamento Geral sobre a Proteção de Dados (Regulamento (UE) 2016/679, “RGPD”) e a Lei n.º 58/2019, de 8 de agosto.",
      ],
    },
    {
      title: "2. Que dados tratamos",
      bullets: [
        "Todos os utilizadores: nome, email, telefone, palavra-passe (guardada de forma cifrada), consentimentos e registos de acesso à conta.",
        "Clientes e organizações: morada, dados de faturação, marcações, mensagens e reclamações. No caso das organizações, também o tipo de organização, o NIPC e o número de registo na ERS ou de alvará do ISS.",
        "Profissionais: dados de identificação, data de nascimento, morada, NIF, NISS, documentos de identificação e de direito de trabalho, comprovativo de atividade, certificado de registo criminal, inscrição profissional ou autorização do ISS, qualificações, seguros, referências, resultados da avaliação de competências, horas prestadas e IBAN.",
        "Pagamentos: tratados pelo Stripe. Não guardamos os dados do seu cartão.",
        "Assistente virtual: o conteúdo das perguntas que escreve no assistente do site.",
      ],
    },
    {
      title: "3. Para que tratamos os dados e com que fundamento",
      bullets: [
        "Criar e gerir a sua conta, fazer marcações, processar pagamentos e pagar aos profissionais — execução do contrato (art. 6.º, n.º 1, alínea b) do RGPD).",
        "Verificar a identidade, a idoneidade e as qualificações dos profissionais antes e depois da aprovação, incluindo o registo criminal — diligências necessárias para garantir a segurança das pessoas apoiadas, nos limites previstos na lei (art. 10.º do RGPD e Lei n.º 113/2009 nas funções com contacto regular com menores).",
        "Cumprir obrigações legais, fiscais e contabilísticas — obrigação jurídica (art. 6.º, n.º 1, alínea c)).",
        "Garantir a segurança da plataforma, prevenir fraude e manter um registo de auditoria das ações relevantes — interesse legítimo (art. 6.º, n.º 1, alínea f)).",
        "Informação sobre saúde que o cliente decida incluir numa marcação é tratada apenas para prestar o serviço pedido e com o consentimento explícito do titular (art. 9.º, n.º 2, alínea a)).",
      ],
    },
    {
      title: "4. Com quem partilhamos os dados",
      paragraphs: [
        "Partilhamos com o profissional atribuído a uma marcação, e com o cliente ou a organização, apenas os dados necessários para essa marcação.",
        "Recorremos a subcontratantes que tratam dados por nossa conta: alojamento da aplicação e da base de dados (Vercel, Supabase), pagamentos (Stripe), envio de emails (Resend) e o assistente virtual (Anthropic). Alguns destes fornecedores podem tratar dados fora do Espaço Económico Europeu; nesses casos, a transferência é feita com as garantias previstas no RGPD, como as cláusulas contratuais-tipo aprovadas pela Comissão Europeia. [Lista e localização a confirmar.]",
        "Podemos ainda comunicar dados às autoridades quando a lei o exija ou para proteger a vida ou a integridade física de alguém.",
      ],
    },
    {
      title: "5. Durante quanto tempo guardamos os dados",
      paragraphs: [
        "Guardamos os dados enquanto a conta estiver ativa. Quando pede o apagamento, os seus dados de identificação e contacto são anonimizados; os registos de conformidade e os registos financeiros são conservados apenas durante os prazos legais (os documentos fiscais e contabilísticos, em regra, durante 10 anos) ou enquanto forem necessários para a defesa de direitos.",
        "O certificado de registo criminal é conservado apenas pelo tempo necessário à verificação e à sua renovação. [Prazo a confirmar.]",
      ],
    },
    {
      title: "6. Os seus direitos",
      paragraphs: [
        "Pode pedir o acesso aos seus dados, a sua retificação, o apagamento, a limitação do tratamento e a portabilidade, opor-se a tratamentos baseados em interesse legítimo e retirar a qualquer momento um consentimento que tenha dado, sem afetar o tratamento já feito.",
        "Respondemos no prazo de um mês. Tem também o direito de apresentar reclamação à Comissão Nacional de Proteção de Dados (CNPD), em www.cnpd.pt.",
      ],
    },
    {
      title: "7. Segurança",
      paragraphs: [
        "Os dados são transmitidos de forma cifrada, os dados bancários são guardados cifrados, o acesso a cada registo está limitado a quem dele precisa e as ações administrativas ficam registadas num registo de auditoria.",
      ],
    },
    {
      title: "8. Cookies",
      paragraphs: [
        "Utilizamos apenas cookies estritamente necessários ao funcionamento do site — manter a sessão iniciada e lembrar o país escolhido. Não utilizamos cookies de publicidade nem de análise.",
      ],
    },
    {
      title: "9. Alterações",
      paragraphs: [
        "Podemos atualizar esta política. Publicamos sempre a versão em vigor nesta página e, quando as alterações forem relevantes, avisamos os utilizadores.",
      ],
    },
  ],
};
