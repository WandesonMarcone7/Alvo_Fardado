window.DATA_QUESTIONS = (window.DATA_QUESTIONS || []).concat([
  {
    id: "esp-hid-01",
    subject: "especificos",
    assuntoId: "esp-hidrometro-classe-i-padrao-instalacao",
    dificuldade: "media",
    fonte: "edital",
    statement: "A classe metrológica de um hidrômetro está diretamente relacionada a:",
    options: [
      "à exatidão do equipamento dentro de sua faixa de vazão de funcionamento.",
      "ao diâmetro nominal da ligação de água.",
      "à cor do corpo do medidor.",
      "ao material da tubulação predial.",
      "ao valor da tarifa aplicada ao imóvel."
    ],
    answer: 0,
    explanation: "A classe metrológica expressa o desempenho do hidrômetro, ou seja, os limites de erro admissíveis ao longo da faixa de vazão em que ele opera. Diâmetro, cor e tarifa não definem a classe."
  },
  {
    id: "esp-hid-02",
    subject: "especificos",
    assuntoId: "esp-hidrometro-classe-i-padrao-instalacao",
    dificuldade: "media",
    fonte: "autoral",
    statement: "Ao instalar um hidrômetro, o padrão técnico do DMAE exige, entre outros cuidados:",
    options: [
      "respeitar trechos retos antes e depois do medidor e manter o registro de leitura acessível e na posição indicada.",
      "instalar o medidor em qualquer inclinação, desde que haja água na rede.",
      "dispensar o lacre quando o imóvel for residencial.",
      "instalar o medidor após o reservatório, para medir apenas a água consumida.",
      "deixar o visor voltado para a parede, para protegê-lo do sol."
    ],
    answer: 0,
    explanation: "O padrão de instalação exige posição correta, trechos retos para estabilizar o fluxo e acesso ao registro de leitura. O lacre é obrigatório e o medidor mede toda a água que entra no imóvel, não apenas a que sai do reservatório."
  },
  {
    id: "esp-func-01",
    subject: "especificos",
    assuntoId: "esp-funcionamento-leitura-hidrometros",
    dificuldade: "media",
    fonte: "autoral",
    statement: "Na maioria das ligações, o hidrômetro mede o volume de água por meio de:",
    options: [
      "contagem do deslocamento de um elemento móvel, proporcional ao volume que atravessa o medidor.",
      "medição direta do peso da água.",
      "leitura da pressão da rede em kgf/cm².",
      "cálculo da umidade relativa do ar.",
      "avaliação da temperatura da água."
    ],
    answer: 0,
    explanation: "O hidrômetro é um medidor de volume: o movimento de um elemento interno (turbina, pistão ou disco) gira um mecanismo de contagem proporcional à água que passa, e essa contagem é convertida em metros cúbicos."
  },
  {
    id: "esp-func-02",
    subject: "especificos",
    assuntoId: "esp-funcionamento-leitura-hidrometros",
    dificuldade: "facil",
    fonte: "autoral",
    statement: "A leitura de um hidrômetro deve ser interpretada da seguinte forma:",
    options: [
      "os algarismos pretos indicam metros cúbicos inteiros e os vermelhos, as frações de metro cúbico (litros).",
      "todos os algarismos, pretos e vermelhos, indicam litros.",
      "os algarismos vermelhos indicam metros cúbicos e os pretos, litros.",
      "apenas o último algarismo é considerado para o faturamento.",
      "a leitura sempre despreza os algarismos pretos."
    ],
    answer: 0,
    explanation: "No mostrador, a parte preta é a leitura em metros cúbicos inteiros (a usada no faturamento) e a parte vermelha representa as frações de metro cúbico, isto é, litros."
  },
  {
    id: "esp-reg-01",
    subject: "especificos",
    assuntoId: "esp-registro-consumo",
    dificuldade: "facil",
    fonte: "autoral",
    statement: "O consumo mensal registrado de uma unidade usuária corresponde a:",
    options: [
      "diferença entre a leitura atual e a leitura anterior do hidrômetro.",
      "soma das leituras atual e anterior.",
      "média das últimas doze leituras.",
      "leitura atual multiplicada pela tarifa.",
      "volume estimado pela área construída do imóvel."
    ],
    answer: 0,
    explanation: "O consumo do período é sempre a subtração: leitura atual menos leitura anterior. As leituras funcionam como um odômetro que só aumenta, e a diferença é o volume consumido."
  },
  {
    id: "esp-reg-02",
    subject: "especificos",
    assuntoId: "esp-registro-consumo",
    dificuldade: "media",
    fonte: "autoral",
    statement: "Quando não é possível realizar a leitura no mês, a prática usual do sistema de abastecimento é:",
    options: [
      "faturar por consumo estimado com base em médias, ajustando quando a leitura for retomada.",
      "suspender definitivamente o fornecimento de água.",
      "cobrar automaticamente o maior consumo já registrado no imóvel.",
      "atribuir consumo zero e isentar o usuário do pagamento.",
      "cancelar a ligação de água."
    ],
    answer: 0,
    explanation: "Sem leitura, emite-se uma conta por consumo estimado (geralmente pela média histórica) e, quando a leitura voltar, o valor é ajustado. Não se cobra o maior consumo nem se isenta o usuário."
  },
  {
    id: "esp-fraude-01",
    subject: "especificos",
    assuntoId: "esp-irregularidades-fraudes-adulteracoes",
    dificuldade: "media",
    fonte: "autoral",
    statement: "Configura fraude ou adulteração do hidrômetro:",
    options: [
      "violar o lacre ou intervir no medidor para reduzir o volume registrado.",
      "lavar a calçada com água da rede.",
      "solicitar a substituição do medidor por desgaste natural.",
      "pagar a conta dentro do prazo de vencimento.",
      "instalar caixa d'água no imóvel."
    ],
    answer: 0,
    explanation: "Fraude é qualquer ação que altere ou impeça a correta medição, como romper o lacre, inverter o medidor, usar ímã ou fazer ligação direta antes do hidrômetro. Uso normal da água não é fraude."
  },
  {
    id: "esp-fraude-02",
    subject: "especificos",
    assuntoId: "esp-irregularidades-fraudes-adulteracoes",
    dificuldade: "dificil",
    fonte: "autoral",
    statement: "Diante de indício de irregularidade no medidor, a conduta correta do agente do DMAE é:",
    options: [
      "registrar a ocorrência de forma detalhada, com data, leitura e evidências, seguindo o procedimento normativo, sem alterar o equipamento por conta própria.",
      "remover imediatamente o medidor e levá-lo para a sede, sem registro.",
      "combinar com o morador a correção e não comunicar o fato.",
      "cobrar em dinheiro, na hora, o valor estimado da fraude.",
      "ignorar, pois irregularidades só podem ser tratadas pela polícia."
    ],
    answer: 0,
    explanation: "O agente deve documentar a ocorrência e seguir o rito normativo da autarquia. Não cabe remover equipamento sem registro, negociar informalmente, receber dinheiro em campo nem deixar de comunicar o fato."
  },
  {
    id: "esp-conta-01",
    subject: "especificos",
    assuntoId: "esp-leitura-emissao-entrega-contas",
    dificuldade: "facil",
    fonte: "edital",
    statement: "A conta de água emitida ao usuário deve conter, entre outras informações:",
    options: [
      "identificação do usuário e da ligação, período, leitura anterior e atual, consumo, valor e vencimento.",
      "apenas o valor a pagar do mês.",
      "somente o nome do usuário e o endereço.",
      "o histórico de consumo dos últimos dez anos.",
      "a lista de funcionários do DMAE."
    ],
    answer: 0,
    explanation: "A fatura permite ao usuário conferir a cobrança, por isso traz leitura anterior e atual, consumo, valor e vencimento, além de dados da ligação. Sem esses elementos, o usuário não poderia questionar o valor."
  },
  {
    id: "esp-conta-02",
    subject: "especificos",
    assuntoId: "esp-leitura-emissao-entrega-contas",
    dificuldade: "media",
    fonte: "autoral",
    statement: "Sobre a entrega da conta, é correto afirmar que:",
    options: [
      "deve ocorrer no endereço ou meio informado pelo usuário, permitindo que ele conheça e questione o valor cobrado.",
      "pode ser omitida quando o cadastro do usuário é antigo.",
      "só pode ser feita por correio, nunca por meio digital.",
      "é opcional quando o consumo é zero.",
      "substitui a leitura do hidrômetro."
    ],
    answer: 0,
    explanation: "A conta precisa chegar ao usuário, físico ou digitalmente, para dar transparência à cobrança. Ela documenta o que foi medido, mas não substitui a leitura do hidrômetro."
  },
  {
    id: "esp-calc-01",
    subject: "especificos",
    assuntoId: "esp-calculo-consumo-conversao-volume",
    dificuldade: "facil",
    fonte: "autoral",
    statement: "Uma ligação tinha leitura anterior de 1.240 m³ e leitura atual de 1.265 m³. O consumo no período foi de:",
    options: ["25 m³", "1.265 m³", "2.505 m³", "105 m³", "20 m³"],
    answer: 0,
    explanation: "Consumo = leitura atual − leitura anterior = 1.265 − 1.240 = 25 m³. Somar as leituras ou subtrair na ordem inversa produz valores sem sentido."
  },
  {
    id: "esp-calc-02",
    subject: "especificos",
    assuntoId: "esp-calculo-consumo-conversao-volume",
    dificuldade: "facil",
    fonte: "autoral",
    statement: "Um consumo de 3,5 m³ corresponde, em litros, a:",
    options: ["3.500 L", "350 L", "35 L", "35.000 L", "0,35 L"],
    answer: 0,
    explanation: "1 m³ equivale a 1.000 litros. Logo, 3,5 m³ = 3,5 × 1.000 = 3.500 litros. Multiplicar por 100 ou por 10 gera erro de conversão."
  },
  {
    id: "esp-tar-01",
    subject: "especificos",
    assuntoId: "esp-estrutura-tarifaria",
    dificuldade: "media",
    fonte: "autoral",
    statement: "A estrutura tarifária do serviço de água e esgoto normalmente considera:",
    options: [
      "categorias de usuários e faixas crescentes de consumo, com valor mínimo cobrado mesmo em consumo baixo.",
      "valor fixo único, independente do consumo e da categoria.",
      "cobrança apenas sobre o volume excedente, sem mínimo.",
      "tarifa definida individualmente por cada morador.",
      "ausência de categorias, com base apenas na área do imóvel."
    ],
    answer: 0,
    explanation: "A tarifa costuma ser escalonada por faixas de consumo e diferenciada por categoria (residencial, comercial, industrial, pública etc.). Há também uma tarifa/volume mínimo faturado, o que garante receita para a manutenção do sistema."
  },
  {
    id: "esp-tar-02",
    subject: "especificos",
    assuntoId: "esp-estrutura-tarifaria",
    dificuldade: "media",
    fonte: "autoral",
    statement: "A chamada tarifa mínima, na prática, refere-se a:",
    options: [
      "ao valor correspondente a um volume/faixa mínima de consumo faturado, mesmo que o consumo medido seja menor.",
      "ao maior valor já cobrado do usuário.",
      "ao desconto concedido a todos os usuários.",
      "ao custo de substituição do hidrômetro.",
      "ao valor cobrado apenas de usuários irregulares."
    ],
    answer: 0,
    explanation: "Por causa dos custos fixos do sistema, cobra-se uma faixa mínima de volume. Se o usuário consumir menos que isso, ainda paga o mínimo; se consumir mais, paga as faixas seguintes."
  },
  {
    id: "esp-cland-01",
    subject: "especificos",
    assuntoId: "esp-ligacoes-clandestinas-fiscalizacao",
    dificuldade: "facil",
    fonte: "edital",
    statement: "Considera-se ligação clandestina:",
    options: [
      "a derivação de água da rede pública sem autorização ou contrato regular com o prestador.",
      "a ligação regular com hidrômetro lacrado.",
      "a substituição do medidor pelo próprio usuário com autorização.",
      "a solicitação de segunda via da conta pelo usuário.",
      "a ligação de esgoto devidamente cadastrada."
    ],
    answer: 0,
    explanation: "Ligação clandestina é a captação irregular, feita sem anuência do prestador e normalmente sem hidrômetro, o que burla o cadastro e a cobrança."
  },
  {
    id: "esp-cland-02",
    subject: "especificos",
    assuntoId: "esp-ligacoes-clandestinas-fiscalizacao",
    dificuldade: "media",
    fonte: "autoral",
    statement: "A fiscalização das ligações de água e esgoto tem por finalidade, entre outras:",
    options: [
      "identificar irregularidades e clandestinidades, coibir fraudes e assegurar a regularidade do cadastro e da cobrança.",
      "aumentar a tarifa de todos os usuários da cidade.",
      "substituir a atuação da polícia em crimes ambientais.",
      "registrar apenas o consumo residencial.",
      "lavrar contratos de fornecimento de energia elétrica."
    ],
    answer: 0,
    explanation: "Fiscalizar é verificar se a ligação e o medidor estão regulares, coibindo perdas e fraudes e mantendo o cadastro e o faturamento corretos. Aumento de tarifa e contratos de energia não são objetos da fiscalização."
  },
  {
    id: "esp-lacre-01",
    subject: "especificos",
    assuntoId: "esp-lacres-padrao-instalacao",
    dificuldade: "facil",
    fonte: "autoral",
    statement: "A principal função do lacre no hidrômetro é:",
    options: [
      "garantir a inviolabilidade do medidor, indicando se houve intervenção não autorizada.",
      "medir a vazão da água.",
      "filtrar impurezas da água.",
      "regular a pressão da rede.",
      "marcar a data da última conta."
    ],
    answer: 0,
    explanation: "O lacre é o dispositivo de segurança que comprova a integridade do medidor. Se for rompido ou alterado, presume-se intervenção indevida, o que compromete a confiabilidade da medição."
  },
  {
    id: "esp-lacre-02",
    subject: "especificos",
    assuntoId: "esp-lacres-padrao-instalacao",
    dificuldade: "media",
    fonte: "autoral",
    statement: "A violação do lacre, sem autorização, caracteriza:",
    options: [
      "irregularidade sujeita às medidas administrativas cabíveis, pois compromete a confiabilidade do medidor.",
      "procedimento normal de manutenção predial.",
      "melhoria da qualidade da água.",
      "redução legal do consumo faturado.",
      "atualização do cadastro do usuário."
    ],
    answer: 0,
    explanation: "O lacre só pode ser rompido por técnico autorizado. A violação sem autorização gera presunção de irregularidade e as medidas administrativas previstas, porque afeta diretamente a medição."
  },
  {
    id: "esp-cad-01",
    subject: "especificos",
    assuntoId: "esp-cadastro-usuarios-classificacao-economias",
    dificuldade: "media",
    fonte: "autoral",
    statement: "No cadastro do usuário, uma 'economia' corresponde a:",
    options: [
      "cada unidade autônoma do imóvel passível de utilização da água, como uma residência ou um estabelecimento.",
      "o valor total da conta do imóvel.",
      "o número de moradores da cidade.",
      "o tipo de tubulação da rua.",
      "a equipe de leitura responsável pela área."
    ],
    answer: 0,
    explanation: "Economia é a unidade de consumo independente dentro do imóvel. Um mesmo terreno pode ter várias economias, e cada uma é cadastrada e faturada separadamente."
  },
  {
    id: "esp-cad-02",
    subject: "especificos",
    assuntoId: "esp-cadastro-usuarios-classificacao-economias",
    dificuldade: "media",
    fonte: "autoral",
    statement: "A classificação das economias (residencial, comercial, industrial, pública, entre outras) é importante porque:",
    options: [
      "influencia a categoria tarifária e o tratamento de faturamento aplicado a cada unidade.",
      "define o horário em que a água pode ser usada.",
      "determina a cor do hidrômetro.",
      "substitui a leitura do medidor.",
      "impede a emissão da conta."
    ],
    answer: 0,
    explanation: "Cada categoria de uso tem tratamento tarifário próprio. Por isso, classificar corretamente a economia é essencial para faturar de forma adequada e evitar cobranças indevidas."
  },
  {
    id: "esp-inf-01",
    subject: "especificos",
    assuntoId: "esp-informatica-basica-aplicada",
    dificuldade: "facil",
    fonte: "autoral",
    statement: "Em uma planilha eletrônica, para somar os valores das células A1 até A10, utiliza-se a função:",
    options: ["=SOMA(A1:A10)", "=MEDIA(A1;A10)", "=SE(A1)", "=CONCATENAR(A1:A10)", "=A1+A10"],
    answer: 0,
    explanation: "O intervalo A1:A10 é escrito com dois-pontos. =SOMA(A1:A10) soma todas as células do intervalo; =A1+A10 somaria apenas as duas extremidades e as demais funções têm outras finalidades."
  },
  {
    id: "esp-inf-02",
    subject: "especificos",
    assuntoId: "esp-informatica-basica-aplicada",
    dificuldade: "facil",
    fonte: "autoral",
    statement: "Sobre segurança da informação no trabalho, uma prática adequada é:",
    options: [
      "usar senhas próprias e não compartilhá-las, além de manter backup dos arquivos importantes.",
      "anotar a senha em papel fixado ao monitor.",
      "compartilhar o login com colegas para agilizar o atendimento.",
      "enviar dados de usuários por e-mail pessoal.",
      "desativar o antivírus para o computador ficar mais rápido."
    ],
    answer: 0,
    explanation: "Senhas individuais e backup protegem os dados. Anotar senha à vista, compartilhar login, usar e-mail pessoal para dados de usuários e desativar antivírus são falhas graves de segurança."
  },
  {
    id: "esp-seg-01",
    subject: "especificos",
    assuntoId: "esp-seguranca-trabalho-epi-nr6",
    dificuldade: "media",
    fonte: "edital",
    statement: "De acordo com a NR-6, o Equipamento de Proteção Individual (EPI) deve ser:",
    options: [
      "fornecido gratuitamente pelo empregador, adequado ao risco e utilizado após treinamento do trabalhador.",
      "comprado pelo próprio trabalhador, sem reembolso.",
      "usado apenas quando o trabalhador quiser.",
      "dispensado quando o serviço é rápido.",
      "substituído a cada dez anos, no máximo."
    ],
    answer: 0,
    explanation: "A NR-6 obriga o empregador a fornecer o EPI gratuitamente, no tamanho adequado ao risco, e a treinar o trabalhador quanto ao uso, guarda e conservação. O uso é obrigatório, não opcional."
  },
  {
    id: "esp-seg-02",
    subject: "especificos",
    assuntoId: "esp-seguranca-trabalho-epi-nr6",
    dificuldade: "media",
    fonte: "edital",
    statement: "O Certificado de Aprovação (CA) do EPI serve para:",
    options: [
      "comprovar que o equipamento atende aos requisitos técnicos de segurança exigidos.",
      "indicar o preço do equipamento.",
      "definir o horário de uso do EPI.",
      "substituir o treinamento do trabalhador.",
      "autorizar a dispensa do EPI."
    ],
    answer: 0,
    explanation: "O CA é emitido por órgão competente e atesta que o EPI cumpre os requisitos técnicos. O empregador só pode fornecer equipamento com CA válido, mas o CA não substitui o treinamento."
  },
  {
    id: "esp-ms888-01",
    subject: "especificos",
    assuntoId: "esp-portaria-gm-ms-888-2021",
    dificuldade: "media",
    fonte: "edital",
    statement: "A Portaria GM/MS nº 888/2021 trata, principalmente, de:",
    options: [
      "procedimentos de controle e vigilância da qualidade da água para consumo humano (potabilidade).",
      "regras de aposentadoria dos servidores municipais.",
      "tabela de tarifas de energia elétrica.",
      "classificação metrológica de hidrômetros.",
      "regras de trânsito em rodovias federais."
    ],
    answer: 0,
    explanation: "A 888/2021 altera o Anexo XX da Portaria de Consolidação GM/MS nº 5/2017 e define os procedimentos de controle e de vigilância da qualidade da água para consumo humano, incluindo o padrão de potabilidade. A classificação de hidrômetros é do Inmetro."
  },
  {
    id: "esp-ms888-02",
    subject: "especificos",
    assuntoId: "esp-portaria-gm-ms-888-2021",
    dificuldade: "dificil",
    fonte: "edital",
    statement: "A aplicação das exigências de potabilidade da água para consumo humano cabe:",
    options: [
      "ao responsável pelo sistema de abastecimento, que deve manter o controle da qualidade, e à vigilância em saúde.",
      "exclusivamente ao usuário da ligação.",
      "somente ao poder legislativo municipal.",
      "apenas às indústrias.",
      "aos fabricantes de tubos."
    ],
    answer: 0,
    explanation: "O normativo distribui responsabilidades: quem opera o abastecimento faz o controle da qualidade da água distribuída, e a vigilância em saúde atua no acompanhamento e na fiscalização sanitária."
  },
  {
    id: "esp-mtp-01",
    subject: "especificos",
    assuntoId: "esp-portaria-mtp-2175-2022-nr6",
    dificuldade: "media",
    fonte: "edital",
    statement: "A Portaria MTP nº 2.175/2022 está relacionada a:",
    options: [
      "à aprovação das Normas Regulamentadoras (NRs) de segurança e saúde no trabalho.",
      "aos padrões de potabilidade da água.",
      "à classificação de hidrômetros do Inmetro.",
      "às diretrizes do saneamento básico.",
      "às tarifas de água e esgoto."
    ],
    answer: 0,
    explanation: "A Portaria MTP nº 2.175/2022 aprova as Normas Regulamentadoras de segurança e saúde no trabalho. Potabilidade é da Portaria GM/MS 888/2021; hidrômetros, do Inmetro; saneamento, da Lei 11.445/2007."
  },
  {
    id: "esp-mtp-02",
    subject: "especificos",
    assuntoId: "esp-portaria-mtp-2175-2022-nr6",
    dificuldade: "facil",
    fonte: "edital",
    statement: "A NR-6 tem como objeto:",
    options: [
      "o uso do Equipamento de Proteção Individual (EPI) no trabalho.",
      "a sinalização de trânsito.",
      "a qualidade da água distribuída.",
      "o cadastro de usuários de água.",
      "a cobrança da conta de esgoto."
    ],
    answer: 0,
    explanation: "A NR-6 é a norma regulamentadora que disciplina o EPI: obrigações do empregador e do empregado, adequação ao risco, treinamento e Certificado de Aprovação."
  },
  {
    id: "esp-9605-01",
    subject: "especificos",
    assuntoId: "esp-lei-9605-1998",
    dificuldade: "media",
    fonte: "edital",
    statement: "A Lei nº 9.605/1998 dispõe sobre:",
    options: [
      "as sanções penais e administrativas derivadas de condutas lesivas ao meio ambiente (crimes ambientais).",
      "o estatuto dos servidores municipais.",
      "o plano de carreira do DMAE.",
      "a estrutura do Poder Executivo municipal.",
      "o código de ética do servidor."
    ],
    answer: 0,
    explanation: "A Lei 9.605/1998 é a Lei de Crimes Ambientais: define condutas lesivas ao meio ambiente e as sanções penais e administrativas aplicáveis a pessoas físicas e jurídicas."
  },
  {
    id: "esp-9605-02",
    subject: "especificos",
    assuntoId: "esp-lei-9605-1998",
    dificuldade: "dificil",
    fonte: "edital",
    statement: "Provocar poluição hídrica que resulte em dano à saúde ou provoque mortandade de animais pode, nos termos da Lei nº 9.605/1998, caracterizar:",
    options: [
      "crime ambiental, sujeitando o responsável a sanções penais e administrativas.",
      "apenas infração administrativa, sem previsão de crime.",
      "conduta irrelevante para o direito ambiental.",
      "situação permitida se houver autorização verbal.",
      "apenas dano civil, sem repercussão penal."
    ],
    answer: 0,
    explanation: "A lei tipifica como crime a poluição em níveis que causem danos à saúde, mortandade de animais ou destruição significativa da flora. As sanções podem ser penais e administrativas, independentemente de autorização informal."
  },
  {
    id: "esp-11445-01",
    subject: "especificos",
    assuntoId: "esp-lei-11445-2007-14026-2020",
    dificuldade: "media",
    fonte: "edital",
    statement: "Segundo a Lei nº 11.445/2007, o saneamento básico compreende, entre outros serviços:",
    options: [
      "abastecimento de água, esgotamento sanitário, limpeza urbana e manejo de resíduos sólidos, e drenagem e manejo de águas pluviais.",
      "apenas o abastecimento de água.",
      "somente a coleta de lixo domiciliar.",
      "energia elétrica e telefonia.",
      "transporte público e segurança."
    ],
    answer: 0,
    explanation: "A lei define saneamento básico como o conjunto de quatro componentes: abastecimento de água, esgotamento sanitário, limpeza urbana e manejo de resíduos sólidos e drenagem/manejo de águas pluviais."
  },
  {
    id: "esp-11445-02",
    subject: "especificos",
    assuntoId: "esp-lei-11445-2007-14026-2020",
    dificuldade: "dificil",
    fonte: "edital",
    statement: "A Lei nº 14.026/2020, que atualizou o marco legal do saneamento, trouxe como diretriz relevante:",
    options: [
      "o fortalecimento da regulação e a ampliação da participação privada na prestação dos serviços.",
      "a extinção dos contratos de concessão.",
      "a proibição de agências reguladoras.",
      "a cobrança exclusiva por estimativa.",
      "o fim do abastecimento de água como serviço público."
    ],
    answer: 0,
    explanation: "A 14.026/2020 modernizou o marco do saneamento: reforçou o papel regulador (com a ANA como referência nacional), incentivou ganhos de escala e ampliou a participação privada por meio de concessões e parcerias."
  },
  {
    id: "esp-dmae-01",
    subject: "especificos",
    assuntoId: "esp-informacoes-oficiais-dmae-hidrometros",
    dificuldade: "facil",
    fonte: "autoral",
    statement: "O DMAE, prestador dos serviços de água e esgoto do município de Uberlândia, atua como:",
    options: [
      "entidade responsável pela operação, manutenção, leitura e faturamento dos serviços, conforme suas normas.",
      "órgão do Poder Judiciário.",
      "empresa de distribuição de energia elétrica.",
      "autarquia federal de saneamento.",
      "órgão de fiscalização de trânsito."
    ],
    answer: 0,
    explanation: "O DMAE é a entidade municipal que opera água e esgoto em Uberlândia, cuidando de manutenção, leitura, faturamento e atendimento ao usuário, nos limites de sua competência."
  },
  {
    id: "esp-dmae-02",
    subject: "especificos",
    assuntoId: "esp-informacoes-oficiais-dmae-hidrometros",
    dificuldade: "media",
    fonte: "autoral",
    statement: "Sobre a substituição de hidrômetros, é correto dizer que o usuário:",
    options: [
      "não deve intervir no medidor; a substituição e a manutenção são realizadas pelo prestador, conforme critérios técnicos.",
      "pode trocar o medidor por conta própria, desde que lacre novamente.",
      "deve trocar o medidor todo mês.",
      "pode remover o lacre se a conta vier alta.",
      "pode instalar medidor próprio paralelo ao oficial."
    ],
    answer: 0,
    explanation: "O medidor pertence ao sistema e sua manutenção cabe ao prestador. Intervenções e trocas pelo usuário, remoção de lacre e medidor paralelo são irregulares e comprometem a medição."
  },
  {
    id: "esp-funasa-01",
    subject: "especificos",
    assuntoId: "esp-manual-saneamento-funasa",
    dificuldade: "media",
    fonte: "edital",
    statement: "O Manual de Saneamento da FUNASA é utilizado como:",
    options: [
      "obra de referência técnica com orientações sobre saneamento, incluindo água, esgoto e resíduos.",
      "legislação federal de crimes ambientais.",
      "regimento interno do DMAE.",
      "plano de carreira dos servidores.",
      "código de ética do município."
    ],
    answer: 0,
    explanation: "O Manual de Saneamento da FUNASA é referência técnica para projetos e ações de saneamento (abastecimento de água, esgotamento sanitário, resíduos e drenagem), e não uma norma jurídica."
  },
  {
    id: "esp-funasa-02",
    subject: "especificos",
    assuntoId: "esp-manual-saneamento-funasa",
    dificuldade: "facil",
    fonte: "edital",
    statement: "A FUNASA é uma fundação pública vinculada ao Ministério da Saúde cuja atuação se relaciona a:",
    options: [
      "ações de saneamento e saúde pública, historicamente no combate a doenças e na melhoria do saneamento.",
      "fiscalização exclusiva de hidrômetros.",
      "regulação de tarifas de energia.",
      "arrecadação de tributos municipais.",
      "gestão do transporte urbano."
    ],
    answer: 0,
    explanation: "A FUNASA atua em saneamento e saúde pública, com foco histórico na prevenção de doenças ligadas à falta de saneamento. Sua atuação é técnica e de fomento, não de regulação tarifária ou arrecadação."
  },
  {
    id: "esp-inmetro-01",
    subject: "especificos",
    assuntoId: "esp-portaria-inmetro-155-2022",
    dificuldade: "media",
    fonte: "edital",
    statement: "A Portaria Inmetro nº 155/2022, no contexto do cargo, relaciona-se a:",
    options: [
      "requisitos de avaliação da conformidade para hidrômetros, no âmbito da metrologia legal.",
      "critérios de potabilidade da água.",
      "normas de segurança do trabalho.",
      "diretrizes do saneamento básico.",
      "código de ética do servidor."
    ],
    answer: 0,
    explanation: "O Inmetro é o órgão de metrologia legal no Brasil. A Portaria 155/2022 trata da avaliação da conformidade de hidrômetros, assegurando que atendam a requisitos técnicos e metrológicos."
  },
  {
    id: "esp-inmetro-02",
    subject: "especificos",
    assuntoId: "esp-portaria-inmetro-155-2022",
    dificuldade: "dificil",
    fonte: "autoral",
    statement: "A metrologia legal, aplicada aos hidrômetros, tem a função de:",
    options: [
      "assegurar a exatidão e a confiabilidade das medições, protegendo as relações de consumo.",
      "definir a tarifa da água.",
      "estabelecer o horário de leitura.",
      "aprovar o código de ética.",
      "regular a qualidade do esgoto."
    ],
    answer: 0,
    explanation: "A medição de água tem impacto direto na cobrança. A metrologia legal garante que o instrumento meça com exatidão, protegendo tanto o consumidor quanto o prestador, mas não fixa tarifas."
  },
  {
    id: "esp-dec-01",
    subject: "especificos",
    assuntoId: "esp-decreto-19545-2021-tarifas",
    dificuldade: "media",
    fonte: "autoral",
    statement: "Um decreto municipal sobre tarifas de água e esgoto usualmente estabelece:",
    options: [
      "a forma de composição, o reajuste/revisão das tarifas e as categorias de usuários.",
      "as normas de segurança do trabalho.",
      "os crimes ambientais.",
      "o plano de carreira do servidor.",
      "o regimento interno do legislativo."
    ],
    answer: 0,
    explanation: "O decreto tarifário define como as tarifas são compostas e atualizadas e quais categorias de usuários existem. As demais alternativas tratam de outros ramos do direito, sem relação com tarifas."
  },
  {
    id: "esp-dec-02",
    subject: "especificos",
    assuntoId: "esp-decreto-19545-2021-tarifas",
    dificuldade: "dificil",
    fonte: "autoral",
    statement: "As tarifas e a estrutura de cobrança do DMAE devem observar:",
    options: [
      "a legislação municipal aplicável, os critérios de regulação e os princípios da modicidade e do equilíbrio econômico-financeiro.",
      "apenas a vontade do usuário.",
      "exclusivamente a média nacional, sem norma local.",
      "critérios definidos unilateralmente por empresas privadas.",
      "a ausência de regras, por se tratar de serviço público."
    ],
    answer: 0,
    explanation: "Serviços públicos tarifados seguem a legislação aplicável e devem conciliar tarifas acessíveis (modicidade) com a sustentabilidade econômica da prestação (equilíbrio econômico-financeiro)."
  },
  {
    id: "esp-hid-03",
    subject: "especificos",
    assuntoId: "esp-hidrometro-classe-i-padrao-instalacao",
    dificuldade: "media",
    fonte: "edital",
    statement: "Um hidrômetro só pode ser instalado em uma ligação de água quando:",
    options: [
      "atende aos requisitos metrológicos exigidos e é fornecido pelo prestador conforme o padrão adotado.",
      "foi comprado pelo usuário em qualquer loja, sem verificação.",
      "possui o visor pintado para não desgastar.",
      "é instalado pelo morador para reduzir a conta.",
      "foi aprovado apenas verbalmente pelo leiturista."
    ],
    answer: 0,
    explanation: "O medidor precisa atender aos requisitos metrológicos (metrologia legal) e seguir o padrão do prestador. A compra e a instalação pelo usuário, fora dos critérios técnicos, não são admitidas."
  },
  {
    id: "esp-hid-04",
    subject: "especificos",
    assuntoId: "esp-hidrometro-classe-i-padrao-instalacao",
    dificuldade: "dificil",
    fonte: "autoral",
    statement: "Por que o padrão de instalação costuma exigir trechos retos de tubulação antes e depois do hidrômetro?",
    options: [
      "Para estabilizar o fluxo e evitar turbulências que prejudicariam a exatidão da medição.",
      "Para deixar a instalação mais longa e difícil de fiscalizar.",
      "Para aumentar a pressão da água entregue ao imóvel.",
      "Para permitir a troca do medidor sem fechar o registro.",
      "Para dispensar o uso do lacre de segurança."
    ],
    answer: 0,
    explanation: "Turbulências e fluxo instável alteram a leitura. Os trechos retos (recomendados pelo fabricante e pelo padrão técnico) organizam o escoamento para que o medidor registre o volume com maior exatidão."
  },
  {
    id: "esp-func-03",
    subject: "especificos",
    assuntoId: "esp-funcionamento-leitura-hidrometros",
    dificuldade: "facil",
    fonte: "autoral",
    statement: "Se a leitura atual de um hidrômetro aparece menor que a leitura anterior, uma explicação provável é:",
    options: [
      "o mostrador completou o ciclo de contagem ou o medidor foi substituído/reiniciado.",
      "o usuário consumiu água negativa no mês.",
      "o hidrômetro deixou de medir definitivamente.",
      "a água voltou pelo cano e zerou o consumo.",
      "a tarifa foi reduzida pelo prestador."
    ],
    answer: 0,
    explanation: "O hidrômetro é um odômetro que só avança, mas pode completar o ciclo do mostrador (virada) ou ter sido trocado. Nessas situações a leitura recomeça menor e o sistema precisa tratar o caso, não concluir que houve consumo negativo."
  },
  {
    id: "esp-func-04",
    subject: "especificos",
    assuntoId: "esp-funcionamento-leitura-hidrometros",
    dificuldade: "media",
    fonte: "autoral",
    statement: "O desgaste natural de um hidrômetro antigo tende a produzir, na medição:",
    options: [
      "subregistro, ou seja, medir menos do que o volume realmente consumido.",
      "superregistro garantido em todos os casos.",
      "aumento da pressão da rede.",
      "melhora da exatidão ao longo do tempo.",
      "mudança da classe metrológica automaticamente."
    ],
    answer: 0,
    explanation: "Com o tempo, folgas e desgaste nas partes móveis reduzem a sensibilidade do medidor, que passa a registrar menos do que o real (subregistro). Por isso há programas de manutenção e substituição periódica."
  },
  {
    id: "esp-reg-03",
    subject: "especificos",
    assuntoId: "esp-registro-consumo",
    dificuldade: "facil",
    fonte: "autoral",
    statement: "Considere: leitura anterior = 452 m³ e leitura atual = 471 m³. O consumo do período é:",
    options: ["19 m³", "471 m³", "923 m³", "29 m³", "9 m³"],
    answer: 0,
    explanation: "Consumo = leitura atual − leitura anterior = 471 − 452 = 19 m³. Somar as leituras ou inverter a subtração produz um valor incorreto."
  },
  {
    id: "esp-reg-04",
    subject: "especificos",
    assuntoId: "esp-registro-consumo",
    dificuldade: "media",
    fonte: "autoral",
    statement: "O consumo médio de uma unidade usuária é útil principalmente para:",
    options: [
      "estimar o consumo em meses sem leitura e identificar variações atípicas.",
      "definir a cor do hidrômetro.",
      "substituir definitivamente a leitura do medidor.",
      "calcular a metragem da área construída.",
      "fixar a tarifa da categoria."
    ],
    answer: 0,
    explanation: "A média histórica orienta a estimativa quando não há leitura e serve de alerta para consumos fora do padrão (possível vazamento ou irregularidade). Ela não substitui a leitura nem define tarifa."
  },
  {
    id: "esp-fraude-03",
    subject: "especificos",
    assuntoId: "esp-irregularidades-fraudes-adulteracoes",
    dificuldade: "facil",
    fonte: "autoral",
    statement: "Aproximar um ímã forte do hidrômetro, com o objetivo de frear a contagem, é exemplo de:",
    options: [
      "fraude, pois interfere indevidamente no funcionamento do medidor.",
      "manutenção preventiva autorizada.",
      "procedimento de leitura.",
      "melhoria da exatidão do equipamento.",
      "atualização do cadastro."
    ],
    answer: 0,
    explanation: "Qualquer interferência externa que altere o registro do volume é fraude. O ímã atua sobre partes internas do medidor e reduz artificialmente a leitura, prejudicando o faturamento."
  },
  {
    id: "esp-fraude-04",
    subject: "especificos",
    assuntoId: "esp-irregularidades-fraudes-adulteracoes",
    dificuldade: "dificil",
    fonte: "edital",
    statement: "Em termos gerais, as fraudes e irregularidades nas ligações afetam o sistema de abastecimento porque:",
    options: [
      "reduzem a receita e mascaram o volume real consumido, prejudicando o planejamento e o custeio do serviço.",
      "aumentam a qualidade da água distribuída.",
      "não têm qualquer impacto financeiro.",
      "só prejudicam imóveis industriais.",
      "melhoram a distribuição de água nas áreas mais distantes."
    ],
    answer: 0,
    explanation: "Além de lesar a arrecadação, a fraude distorce os dados de consumo usados no planejamento da rede. O efeito recai sobre todo o sistema, pois parte dos custos é rateada entre os usuários regulares."
  },
  {
    id: "esp-conta-03",
    subject: "especificos",
    assuntoId: "esp-leitura-emissao-entrega-contas",
    dificuldade: "media",
    fonte: "autoral",
    statement: "Ao contestar o valor de uma conta de água, o usuário deve, preferencialmente:",
    options: [
      "procurar o canal de atendimento do prestador, munido da conta e das leituras, para verificação.",
      "deixar de pagar todas as contas até ser procurado.",
      "trocar o hidrômetro por conta própria.",
      "remover o lacre para provar que houve erro.",
      "pagar somente metade do valor."
    ],
    answer: 0,
    explanation: "A contestação deve seguir o canal oficial, com a conta e as leituras em mãos, para que o prestador verifique a medição. Interferir no medidor ou simplesmente deixar de pagar não é a via adequada e pode gerar irregularidades."
  },
  {
    id: "esp-conta-04",
    subject: "especificos",
    assuntoId: "esp-leitura-emissao-entrega-contas",
    dificuldade: "facil",
    fonte: "autoral",
    statement: "A leitura registrada na conta deve corresponder:",
    options: [
      "ao que o hidrômetro efetivamente indicava na data da leitura.",
      "a uma estimativa fixa igual para todos os imóveis.",
      "ao consumo do imóvel vizinho.",
      "à média anual da cidade.",
      "ao valor mínimo da tarifa."
    ],
    answer: 0,
    explanation: "A conta deve refletir a leitura real do medidor na visita. Estimativas só se justificam quando a leitura não foi possível e devem ser identificadas e ajustadas depois."
  },
  {
    id: "esp-calc-03",
    subject: "especificos",
    assuntoId: "esp-calculo-consumo-conversao-volume",
    dificuldade: "media",
    fonte: "autoral",
    statement: "Um imóvel consumiu 0,25 m³ em um dia. Esse volume corresponde a:",
    options: ["250 litros", "25 litros", "2.500 litros", "2,5 litros", "250.000 litros"],
    answer: 0,
    explanation: "1 m³ = 1.000 L. Logo, 0,25 × 1.000 = 250 L. Deslocar a vírgula de forma errada ou multiplicar por 100 produz resultados incorretos."
  },
  {
    id: "esp-calc-04",
    subject: "especificos",
    assuntoId: "esp-calculo-consumo-conversao-volume",
    dificuldade: "media",
    fonte: "autoral",
    statement: "Se 1 m³ custa R$ 6,00 e o consumo do mês foi de 12 m³, o valor da água no mês é:",
    options: ["R$ 72,00", "R$ 18,00", "R$ 60,00", "R$ 120,00", "R$ 6,00"],
    answer: 0,
    explanation: "Valor = consumo × preço do m³ = 12 × 6 = R$ 72,00. Some-se, quando houver, a parcela de esgoto e a tarifa mínima prevista na estrutura tarifária."
  },
  {
    id: "esp-tar-03",
    subject: "especificos",
    assuntoId: "esp-estrutura-tarifaria",
    dificuldade: "facil",
    fonte: "autoral",
    statement: "A cobrança de esgoto na conta de água, quando prevista, normalmente observa:",
    options: [
      "um percentual sobre o valor da água, conforme a legislação e a estrutura tarifária.",
      "um valor aleatório definido pelo leiturista.",
      "o mesmo valor fixo para todos os imóveis do município.",
      "a quantidade de moradores do imóvel.",
      "a metragem da calçada."
    ],
    answer: 0,
    explanation: "A tarifa de esgoto costuma ser calculada como percentual do valor da água, variando conforme as regras locais. Não depende da vontade do agente nem de dados do imóvel sem previsão normativa."
  },
  {
    id: "esp-tar-04",
    subject: "especificos",
    assuntoId: "esp-estrutura-tarifaria",
    dificuldade: "dificil",
    fonte: "autoral",
    statement: "Em uma tarifa por faixas crescentes de consumo, o objetivo é:",
    options: [
      "cobrar proporcionalmente mais de quem consome mais, incentivando o uso racional da água.",
      "cobrar o mesmo de todos, independentemente do volume consumido.",
      "premiar com tarifa zero os maiores consumidores.",
      "eliminar a tarifa mínima em qualquer hipótese.",
      "definir o preço pela renda do usuário."
    ],
    answer: 0,
    explanation: "As faixas crescentes fazem o preço unitário subir conforme o consumo aumenta, criando um sinal econômico para o uso racional. O consumo essencial tende a pagar menos por metro cúbico."
  },
  {
    id: "esp-cland-03",
    subject: "especificos",
    assuntoId: "esp-ligacoes-clandestinas-fiscalizacao",
    dificuldade: "media",
    fonte: "autoral",
    statement: "Ao identificar uma ligação clandestina, a atuação adequada do agente é:",
    options: [
      "registrar os fatos, comunicar o setor competente e adotar as medidas previstas na norma, sem iniciativas pessoais.",
      "cobrar do morador, em dinheiro, o valor estimado.",
      "remover a ligação sem qualquer registro.",
      "ignorar, por se tratar de assunto exclusivamente policial.",
      "negociar a regularização informalmente."
    ],
    answer: 0,
    explanation: "A clandestinidade exige registro e encaminhamento conforme o rito da autarquia. Receber valores em campo, agir sem registro ou negociar informalmente são condutas vedadas."
  },
  {
    id: "esp-cland-04",
    subject: "especificos",
    assuntoId: "esp-ligacoes-clandestinas-fiscalizacao",
    dificuldade: "facil",
    fonte: "edital",
    statement: "A diferença central entre ligação clandestina e ligação regular está em:",
    options: [
      "existir ou não autorização/contrato com o prestador e medição adequada.",
      "o material da tubulação utilizada.",
      "a cor do imóvel.",
      "o bairro onde o imóvel se localiza.",
      "a quantidade de moradores."
    ],
    answer: 0,
    explanation: "A ligação regular nasce de contrato/autorização com o prestador e conta com medição. A clandestina é obtida sem anuência, normalmente sem medidor, burlando o cadastro e a cobrança."
  },
  {
    id: "esp-lacre-03",
    subject: "especificos",
    assuntoId: "esp-lacres-padrao-instalacao",
    dificuldade: "media",
    fonte: "autoral",
    statement: "A quebra ou remoção do lacre do hidrômetro pode ser feita legitimamente:",
    options: [
      "apenas por agente autorizado do prestador, no exercício de suas funções e com registro.",
      "por qualquer pessoa, desde que a água esteja fechada.",
      "pelo proprietário, sempre que desconfiar de vazamento.",
      "pelo síndico, em nome dos condôminos.",
      "por empresa terceirizada, sem comunicação ao prestador."
    ],
    answer: 0,
    explanation: "O lacre protege a medição. Sua violação só é legítima por agente autorizado, dentro de procedimento formal. Romper o lacre por conta própria gera presunção de irregularidade."
  },
  {
    id: "esp-lacre-04",
    subject: "especificos",
    assuntoId: "esp-lacres-padrao-instalacao",
    dificuldade: "facil",
    fonte: "autoral",
    statement: "O registro das características do lacre e do medidor no momento da instalação serve para:",
    options: [
      "permitir a identificação do equipamento e a detecção de violação em inspeções futuras.",
      "decorar a instalação.",
      "substituir a leitura mensal.",
      "definir a tarifa aplicada ao imóvel.",
      "dispensar o cadastro do usuário."
    ],
    answer: 0,
    explanation: "Anotar número, data e condição do medidor e do lacre cria um histórico que permite comparar o estado do equipamento depois. Assim, é possível perceber trocas ou violações indevidas."
  },
  {
    id: "esp-cad-03",
    subject: "especificos",
    assuntoId: "esp-cadastro-usuarios-classificacao-economias",
    dificuldade: "facil",
    fonte: "autoral",
    statement: "Alterações relevantes no imóvel, como mudança de uso ou criação de nova unidade, devem levar a:",
    options: [
      "atualização do cadastro do usuário e, se for o caso, nova classificação da economia.",
      "manutenção do cadastro antigo, para simplificar.",
      "cancelamento automático da ligação.",
      "cobrança retroativa sem registro.",
      "troca do hidrômetro a cada alteração."
    ],
    answer: 0,
    explanation: "O cadastro precisa refletir a realidade do imóvel. Mudanças de uso ou novas economias alteram a categoria e o faturamento, por isso exigem atualização e reclassificação quando cabível."
  },
  {
    id: "esp-cad-04",
    subject: "especificos",
    assuntoId: "esp-cadastro-usuarios-classificacao-economias",
    dificuldade: "media",
    fonte: "autoral",
    statement: "Em um mesmo terreno com uma loja e uma residência, cada uma com entrada independente, o correto é:",
    options: [
      "cadastrar cada unidade como uma economia, com classificação própria.",
      "tratar tudo como economia única, somando os consumos.",
      "classificar tudo como residencial automaticamente.",
      "considerar apenas a maior unidade.",
      "exigir um único hidrômetro para todo o terreno."
    ],
    answer: 0,
    explanation: "Cada unidade autônoma e independente é uma economia, com classificação e faturamento próprios. Somar usos distintos em uma única economia distorceria o cadastro e a tarifa."
  },
  {
    id: "esp-inf-03",
    subject: "especificos",
    assuntoId: "esp-informatica-basica-aplicada",
    dificuldade: "media",
    fonte: "autoral",
    statement: "Em uma planilha, a fórmula =MÉDIA(B2:B10) serve para:",
    options: [
      "calcular a média aritmética dos valores do intervalo de B2 a B10.",
      "somar os valores de B2 e B10 apenas.",
      "contar quantas células existem no intervalo.",
      "exibir o maior valor do intervalo.",
      "multiplicar B2 por B10."
    ],
    answer: 0,
    explanation: "MÉDIA calcula a média dos números do intervalo. Somar é SOMA, contar é CONT.VALORES/CONT.NUM, o maior é MÁX e multiplicar seria feito com operador ou PRODUTO."
  },
  {
    id: "esp-inf-04",
    subject: "especificos",
    assuntoId: "esp-informatica-basica-aplicada",
    dificuldade: "media",
    fonte: "autoral",
    statement: "No tratamento de dados de usuários em arquivos digitais, uma conduta adequada é:",
    options: [
      "acessar apenas o necessário para o trabalho, restringindo cópias e compartilhamentos indevidos.",
      "enviar planilhas completas para colegas por e-mail pessoal.",
      "salvar os dados em dispositivos particulares sem controle.",
      "divulgar listas de usuários em grupos de mensagem.",
      "manter a mesma senha compartilhada por toda a equipe."
    ],
    answer: 0,
    explanation: "Dados pessoais exigem cuidado: acesso restrito ao necessário, sem cópias e compartilhamentos indevidos. Práticas como e-mail pessoal, dispositivos particulares e senha compartilhada ampliam o risco de vazamento."
  },
  {
    id: "esp-seg-03",
    subject: "especificos",
    assuntoId: "esp-seguranca-trabalho-epi-nr6",
    dificuldade: "facil",
    fonte: "edital",
    statement: "Segundo a NR-6, cabe ao trabalhador, quanto ao EPI:",
    options: [
      "usar o equipamento apenas para a finalidade a que se destina e responsabilizar-se pela sua guarda e conservação.",
      "escolher o equipamento sem orientação do empregador.",
      "vender o equipamento recebido.",
      "usar o EPI mesmo danificado.",
      "dispensar o EPI quando o serviço for curto."
    ],
    answer: 0,
    explanation: "A NR-6 impõe deveres a ambos os lados. Ao trabalhador cabe usar o EPI adequadamente, zelar por ele e comunicar qualquer alteração que o torne impróprio, sendo o uso obrigatório."
  },
  {
    id: "esp-seg-04",
    subject: "especificos",
    assuntoId: "esp-seguranca-trabalho-epi-nr6",
    dificuldade: "media",
    fonte: "edital",
    statement: "Quando a situação de risco pode ser eliminada ou reduzida por proteção coletiva, a ordem correta é:",
    options: [
      "adotar primeiro as medidas de proteção coletiva e usar o EPI de forma complementar.",
      "usar somente o EPI, dispensando a proteção coletiva.",
      "usar apenas proteção coletiva e nunca o EPI.",
      "alternar entre EPI e proteção coletiva conforme a conveniência.",
      "não adotar nenhuma medida se o serviço for rápido."
    ],
    answer: 0,
    explanation: "A proteção coletiva beneficia todos e deve ter prioridade; o EPI é complementar. Ele não substitui as medidas que eliminam ou controlam o risco na fonte."
  },
  {
    id: "esp-ms888-03",
    subject: "especificos",
    assuntoId: "esp-portaria-gm-ms-888-2021",
    dificuldade: "media",
    fonte: "edital",
    statement: "O padrão de potabilidade estabelecido na norma de qualidade da água define:",
    options: [
      "limites e critérios que a água para consumo humano deve atender para ser considerada adequada.",
      "a tabela de tarifas de água e esgoto.",
      "as classes metrológicas dos hidrômetros.",
      "as normas de segurança do trabalho.",
      "os prazos de entrega da conta."
    ],
    answer: 0,
    explanation: "O padrão de potabilidade reúne limites microbiológicos, químicos e físicos que caracterizam a água segura para consumo humano. Tarifas, hidrômetros e segurança do trabalho têm normas próprias."
  },
  {
    id: "esp-ms888-04",
    subject: "especificos",
    assuntoId: "esp-portaria-gm-ms-888-2021",
    dificuldade: "dificil",
    fonte: "edital",
    statement: "A diferença entre controle e vigilância da qualidade da água é que:",
    options: [
      "o controle é exercido por quem opera o abastecimento; a vigilância é exercida pelo setor de saúde.",
      "controle e vigilância são exercidos pela mesma pessoa, sem distinção.",
      "a vigilância opera a estação de tratamento; o controle apenas fiscaliza.",
      "o controle só existe em cidades grandes.",
      "a vigilância substitui o prestador na distribuição."
    ],
    answer: 0,
    explanation: "O operador do sistema faz o controle da qualidade da água que produz e distribui; a autoridade de saúde faz a vigilância, avaliando e fiscalizando o resultado. São papéis distintos e complementares."
  },
  {
    id: "esp-mtp-03",
    subject: "especificos",
    assuntoId: "esp-portaria-mtp-2175-2022-nr6",
    dificuldade: "facil",
    fonte: "edital",
    statement: "As Normas Regulamentadoras (NRs) de segurança e saúde no trabalho são:",
    options: [
      "normas de observância obrigatória relativas à segurança e medicina do trabalho.",
      "recomendações sem caráter obrigatório.",
      "leis exclusivamente municipais.",
      "normas de trânsito rodoviário.",
      "regras de qualidade da água."
    ],
    answer: 0,
    explanation: "As NRs são aprovadas por portaria e têm caráter obrigatório para empregadores e trabalhadores nas atividades abrangidas. Elas disciplinam segurança e medicina do trabalho."
  },
  {
    id: "esp-mtp-04",
    subject: "especificos",
    assuntoId: "esp-portaria-mtp-2175-2022-nr6",
    dificuldade: "media",
    fonte: "edital",
    statement: "A fiscalização do cumprimento das Normas Regulamentadoras compete, tipicamente:",
    options: [
      "aos órgãos de fiscalização do trabalho, no âmbito de sua competência.",
      "exclusivamente ao próprio empregado.",
      "apenas às prefeituras, sem órgão federal.",
      "ao sindicato patronal.",
      "à empresa de fornecimento de EPI."
    ],
    answer: 0,
    explanation: "A auditoria-fiscal do trabalho verifica o cumprimento das NRs. Empregador e trabalhador têm responsabilidades, mas a fiscalização estatal é atribuição de órgão competente."
  },
  {
    id: "esp-9605-03",
    subject: "especificos",
    assuntoId: "esp-lei-9605-1998",
    dificuldade: "media",
    fonte: "edital",
    statement: "Conforme a Lei nº 9.605/1998, as sanções por condutas lesivas ao meio ambiente podem incluir:",
    options: [
      "penas privativas de liberdade, restritivas de direitos, multas e sanções administrativas.",
      "apenas advertência verbal.",
      "somente pagamento em dinheiro, sem outras consequências.",
      "unicamente suspensão do direito de votar.",
      "apenas medidas educativas."
    ],
    answer: 0,
    explanation: "A lei prevê um conjunto de sanções penais (detenção, multa, restritivas de direitos) e administrativas, aplicáveis conforme a gravidade da conduta e a responsabilidade do agente."
  },
  {
    id: "esp-9605-04",
    subject: "especificos",
    assuntoId: "esp-lei-9605-1998",
    dificuldade: "dificil",
    fonte: "edital",
    statement: "Sobre a responsabilidade por crimes ambientais, a Lei nº 9.605/1998:",
    options: [
      "prevê responsabilização de pessoas físicas e jurídicas.",
      "responsabiliza apenas pessoas físicas.",
      "responsabiliza apenas pessoas jurídicas.",
      "dispensa a responsabilidade do autor material.",
      "aplica-se somente a órgãos públicos."
    ],
    answer: 0,
    explanation: "A lei atinge pessoas físicas e jurídicas, admitindo penalidades compatíveis com a natureza de cada uma, sem afastar a responsabilidade dos autores materiais das condutas lesivas."
  },
  {
    id: "esp-11445-03",
    subject: "especificos",
    assuntoId: "esp-lei-11445-2007-14026-2020",
    dificuldade: "facil",
    fonte: "edital",
    statement: "No marco legal do saneamento, a titularidade dos serviços públicos de saneamento básico é, em regra:",
    options: [
      "do Município, que pode prestá-los diretamente ou delegá-los.",
      "exclusivamente da União.",
      "exclusivamente de empresas privadas.",
      "dos usuários, reunidos em associação.",
      "dos estados, sem qualquer competência municipal."
    ],
    answer: 0,
    explanation: "O titular dos serviços é o Município (ou o Distrito Federal), que pode prestá-los de forma direta ou delegar a prestação, mantendo-se responsável pela regulação e pelo controle."
  },
  {
    id: "esp-11445-04",
    subject: "especificos",
    assuntoId: "esp-lei-11445-2007-14026-2020",
    dificuldade: "dificil",
    fonte: "edital",
    statement: "A atualização do marco do saneamento reforçou a regulação dos serviços com o objetivo de:",
    options: [
      "buscar a universalização com qualidade, estabilidade das regras e segurança jurídica para investimentos.",
      "eliminar a cobrança de tarifas.",
      "impedir a participação de empresas no setor.",
      "acabar com os contratos de concessão.",
      "retirar a competência dos municípios."
    ],
    answer: 0,
    explanation: "A regulação busca dar previsibilidade e qualidade à prestação, incentivando investimentos em direção à universalização. Não elimina tarifas nem a atuação de empresas, que seguem modelos de concessão e parceria."
  },
  {
    id: "esp-dmae-03",
    subject: "especificos",
    assuntoId: "esp-informacoes-oficiais-dmae-hidrometros",
    dificuldade: "facil",
    fonte: "autoral",
    statement: "Ao perceber vazamento de água antes do hidrômetro, o usuário deve:",
    options: [
      "comunicar o prestador pelos canais oficiais de atendimento para providências.",
      "aguardar a próxima conta para verificar.",
      "romper o lacre do medidor para conter o vazamento.",
      "interditar a rua por conta própria.",
      "deixar de pagar a conta."
    ],
    answer: 0,
    explanation: "Vazamento a montante do medidor (na rede ou ligação até o hidrômetro) é responsabilidade do prestador e deve ser comunicado pelos canais oficiais. Interferir no medidor ou deixar de pagar não resolve e cria irregularidade."
  },
  {
    id: "esp-dmae-04",
    subject: "especificos",
    assuntoId: "esp-informacoes-oficiais-dmae-hidrometros",
    dificuldade: "media",
    fonte: "autoral",
    statement: "O hidrômetro é considerado parte integrante do sistema de abastecimento porque:",
    options: [
      "é o instrumento que mede o volume consumido, base para o faturamento e para o controle de perdas.",
      "serve apenas para enfeitar a fachada do imóvel.",
      "substitui a estação de tratamento.",
      "define a qualidade da água distribuída.",
      "impede o vazamento na rede."
    ],
    answer: 0,
    explanation: "O medidor é o elo entre o consumo físico e a cobrança. Seus dados alimentam o faturamento e o balanço hídrico (controle de perdas), por isso ele é parte essencial do sistema."
  },
  {
    id: "esp-funasa-03",
    subject: "especificos",
    assuntoId: "esp-manual-saneamento-funasa",
    dificuldade: "facil",
    fonte: "edital",
    statement: "O Manual de Saneamento da FUNASA costuma abranger, entre outros conteúdos:",
    options: [
      "abastecimento de água, esgotamento sanitário, resíduos sólidos e drenagem.",
      "somente licitações públicas.",
      "apenas o código de ética do servidor.",
      "a tabela de tarifas de energia elétrica.",
      "as normas de trânsito."
    ],
    answer: 0,
    explanation: "A publicação reúne orientações técnicas sobre os componentes do saneamento, servindo de referência para projetos, operação e ações de saúde pública."
  },
  {
    id: "esp-funasa-04",
    subject: "especificos",
    assuntoId: "esp-manual-saneamento-funasa",
    dificuldade: "media",
    fonte: "autoral",
    statement: "É correto afirmar que o Manual de Saneamento da FUNASA:",
    options: [
      "é referência técnica de apoio, e não uma norma jurídica impositiva.",
      "equivale a uma lei federal.",
      "revoga as normas da vigilância sanitária.",
      "substitui a constituição municipal.",
      "só se aplica a estados do Sudeste."
    ],
    answer: 0,
    explanation: "O manual organiza conhecimento técnico e recomendações, apoiando projetos e a operação dos serviços. Quem impõe obrigações são as leis, portarias e demais normas jurídicas aplicáveis."
  },
  {
    id: "esp-inmetro-03",
    subject: "especificos",
    assuntoId: "esp-portaria-inmetro-155-2022",
    dificuldade: "facil",
    fonte: "edital",
    statement: "No Brasil, o órgão responsável pela metrologia legal, incluindo a regulação de instrumentos de medição como hidrômetros, é:",
    options: ["o Inmetro.", "a FUNASA.", "o DMAE.", "o Ministério da Fazenda.", "a Câmara Municipal."],
    answer: 0,
    explanation: "O Inmetro é a autarquia federal responsável pela metrologia legal e pela avaliação da conformidade. Ele define requisitos que os instrumentos de medição devem atender."
  },
  {
    id: "esp-inmetro-04",
    subject: "especificos",
    assuntoId: "esp-portaria-inmetro-155-2022",
    dificuldade: "media",
    fonte: "edital",
    statement: "O conceito de erro máximo admissível, aplicado a um hidrômetro, indica:",
    options: [
      "o limite de erro tolerado na medição, definido por requisitos técnicos, dentro de faixas de vazão.",
      "o maior desconto que o usuário pode pedir.",
      "a tarifa máxima permitida ao prestador.",
      "o número máximo de moradores por imóvel.",
      "a idade máxima do medidor antes da troca."
    ],
    answer: 0,
    explanation: "Os requisitos metrológicos estabelecem faixas de vazão e o erro máximo tolerado em cada uma. O hidrômetro aprovado deve operar dentro desses limites, o que garante a confiabilidade da medição."
  },
  {
    id: "esp-dec-03",
    subject: "especificos",
    assuntoId: "esp-decreto-19545-2021-tarifas",
    dificuldade: "media",
    fonte: "autoral",
    statement: "O reajuste e a revisão de tarifas de água e esgoto distinguem-se porque:",
    options: [
      "o reajuste atualiza valores pela variação de custos; a revisão reexamina a estrutura e os custos de forma mais ampla.",
      "são exatamente a mesma coisa, apenas com nomes diferentes.",
      "o reajuste redefine categorias; a revisão só corrige a inflação.",
      "a revisão ocorre todo mês; o reajuste, a cada dez anos.",
      "nenhum dos dois pode alterar o valor cobrado."
    ],
    answer: 0,
    explanation: "O reajuste costuma ser a atualização periódica pelo índice de custos/inflação; a revisão é mais profunda, reavaliando a estrutura tarifária, os custos e a modicidade. São instrumentos diferentes de regulação."
  },
  {
    id: "esp-dec-04",
    subject: "especificos",
    assuntoId: "esp-decreto-19545-2021-tarifas",
    dificuldade: "dificil",
    fonte: "autoral",
    statement: "Ao definir tarifas, o equilíbrio econômico-financeiro busca:",
    options: [
      "assegurar receita suficiente para a prestação e a manutenção do serviço, mantendo a tarifa acessível ao usuário.",
      "maximizar o lucro sem qualquer limite.",
      "zerar a tarifa para todos os usuários.",
      "eliminar a necessidade de investimentos.",
      "definir o valor por sorteio."
    ],
    answer: 0,
    explanation: "O equilíbrio concilia a sustentabilidade da prestação (cobrir custos, manter e ampliar o sistema) com a modicidade, para que o serviço permaneça acessível. Não se trata de busca de lucro irrestrito nem de tarifa zero."
  }
]);
