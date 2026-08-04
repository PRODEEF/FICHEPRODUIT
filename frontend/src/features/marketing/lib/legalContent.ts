export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
}

export interface LegalDocumentContent {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
  };
  /** Avertissement affiché en haut de page indiquant que le contenu est provisoire. */
  draftNotice: string;
  sections: LegalSection[];
}

/** Conditions Générales d'Utilisation — brouillon partiellement renseigné. */
export const TERMS_OF_SERVICE: LegalDocumentContent = {
  hero: {
    badge: "Conditions d'utilisation",
    title: "Conditions Générales d'Utilisation",
    subtitle: "Veuillez lire attentivement ces conditions avant d'utiliser Fiche Produit.",
  },
  draftNotice:
    'Ce document est un brouillon. Certaines mentions juridiques (statut de la société, tribunal compétent) restent à compléter.',
  sections: [
    {
      id: 'objet',
      title: '1. Objet',
      paragraphs: [
        "Les présentes conditions générales d'utilisation (ci-après « CGU ») ont pour objet de définir les modalités et conditions d'accès et d'utilisation du service Fiche Produit (ci-après « le Service »), nom commercial de la société PRODEEF (ci-après « l'Éditeur »).",
        "Le Service s'adresse aux professionnels (B2B), notamment aux e-commerçants, pour la génération et la gestion de fiches produits.",
        "En accédant au Service, l'utilisateur accepte sans réserve les présentes CGU. Si l'utilisateur n'accepte pas ces conditions, il doit cesser immédiatement toute utilisation du Service.",
      ],
    },
    {
      id: 'acces-service',
      title: '2. Accès au service',
      paragraphs: [
        "Le Service est accessible à toute personne physique ou morale agissant à des fins professionnelles, disposant d'une connexion internet et ayant créé un compte utilisateur. L'Éditeur se réserve le droit de refuser l'accès au Service à tout utilisateur qui ne respecterait pas les présentes CGU.",
        "L'accès au Service est conditionné à la création d'un compte. L'utilisateur s'engage à fournir des informations exactes, complètes et à jour lors de son inscription et à les maintenir à jour.",
        "L'utilisateur est responsable de la confidentialité de ses identifiants de connexion et de toute activité effectuée depuis son compte.",
      ],
    },
    {
      id: 'utilisation-service',
      title: '3. Utilisation du service',
      paragraphs: [
        "À ce jour, le Service est proposé gratuitement. L'Éditeur se réserve le droit de faire évoluer le modèle économique (notamment l'introduction d'offres payantes) en informant les utilisateurs.",
        "L'utilisateur s'engage à utiliser le Service conformément aux lois et règlements en vigueur et aux présentes CGU. Il est notamment interdit d'utiliser le Service à des fins illicites ou de contourner les mécanismes de sécurité mis en place.",
        "L'Éditeur se réserve le droit de suspendre ou de résilier le compte de tout utilisateur en cas de violation des présentes CGU, sans préavis ni indemnité.",
      ],
    },
    {
      id: 'propriete-intellectuelle',
      title: '4. Propriété intellectuelle',
      paragraphs: [
        "L'ensemble des éléments constituant le Service (logiciels, textes, images, marques, logos, etc.) sont la propriété exclusive de l'Éditeur ou font l'objet d'une autorisation d'utilisation. Toute reproduction, représentation ou exploitation, même partielle, est strictement interdite sans autorisation préalable écrite de l'Éditeur.",
        "Les contenus générés par le Service à partir des données de l'utilisateur restent la propriété de l'utilisateur, sous réserve du respect des présentes CGU.",
      ],
    },
    {
      id: 'droit-applicable',
      title: '5. Droit applicable',
      paragraphs: [
        'Les présentes CGU sont régies par le droit français.',
        "En cas de litige, et à défaut de résolution amiable, les tribunaux compétents seront ceux du ressort du siège social de PRODEEF ([VILLE DU SIÈGE — À COMPLÉTER]), sous réserve des dispositions d'ordre public applicables.",
      ],
    },
  ],
};

/** Politique de Confidentialité — brouillon partiellement renseigné. */
export const PRIVACY_POLICY: LegalDocumentContent = {
  hero: {
    badge: 'Vie privée',
    title: 'Politique de Confidentialité',
    subtitle: 'Comment Fiche Produit collecte, utilise et protège vos données personnelles.',
  },
  draftNotice:
    "Ce document est un brouillon. L'adresse du siège social et la validation juridique définitive restent à compléter.",
  sections: [
    {
      id: 'responsable-traitement',
      title: '1. Responsable du traitement',
      paragraphs: [
        'Le responsable du traitement des données personnelles collectées via le Service est PRODEEF (nom commercial : Fiche Produit). Adresse du siège : [ADRESSE — À COMPLÉTER]. Contact : yann@prodeef.com.',
        "Pour toute question relative à la protection de vos données, vous pouvez nous contacter à l'adresse : yann@prodeef.com.",
      ],
    },
    {
      id: 'donnees-collectees',
      title: '2. Données collectées',
      paragraphs: [
        "Dans le cadre de l'utilisation du Service, nous collectons notamment : informations d'identification (adresse email, éventuelles informations de profil), données de navigation techniques nécessaires au fonctionnement du Service, et données relatives à votre boutique en ligne (URL, marques, catégories, secteur).",
        "Nous ne collectons que les données strictement nécessaires à la fourniture du Service. Aucune donnée sensible (au sens de l'article 9 du RGPD) n'est collectée. Aucune donnée de paiement n'est collectée tant que le Service demeure gratuit.",
      ],
    },
    {
      id: 'finalites',
      title: '3. Finalités du traitement',
      paragraphs: [
        'Vos données sont traitées aux fins suivantes : fourniture et amélioration du Service, gestion de votre compte, communication relative au Service (notifications, mises à jour), et respect de nos obligations légales.',
        'Nous ne vendons pas vos données personnelles à des tiers. Certaines données peuvent être traitées par nos sous-traitants techniques (hébergement, authentification) dans le strict cadre de la fourniture du Service.',
      ],
    },
    {
      id: 'droits',
      title: '4. Vos droits',
      paragraphs: [
        "Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles : droit d'accès, de rectification, d'effacement, de limitation du traitement, de portabilité et d'opposition.",
        "Vous pouvez exercer votre droit d'effacement directement depuis votre profil (section « Supprimer mon compte »). Vous pouvez également nous contacter à yann@prodeef.com pour toute autre demande. Vous disposez du droit d'introduire une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés).",
      ],
    },
  ],
};

/** Mentions Légales — brouillon partiellement renseigné. */
export const LEGAL_NOTICE: LegalDocumentContent = {
  hero: {
    badge: 'Informations légales',
    title: 'Mentions Légales',
    subtitle: "Informations légales relatives à l'éditeur et à l'hébergeur de Fiche Produit.",
  },
  draftNotice:
    'Ce document est un brouillon. Forme juridique, capital, RCS et adresse du siège restent à compléter.',
  sections: [
    {
      id: 'editeur',
      title: '1. Éditeur du site',
      paragraphs: [
        'Le site Fiche Produit est édité par PRODEEF ([FORME JURIDIQUE — À COMPLÉTER]) au capital de [MONTANT — À COMPLÉTER] €, immatriculée au Registre du Commerce et des Sociétés de [VILLE — À COMPLÉTER] sous le numéro [RCS / SIREN — À COMPLÉTER].',
        'Nom commercial : Fiche Produit. Siège social : [ADRESSE — À COMPLÉTER]. Email : yann@prodeef.com.',
        'Directeur de la publication : Yann Le Core.',
      ],
    },
    {
      id: 'hebergeur',
      title: '2. Hébergeur',
      paragraphs: [
        'Le site est hébergé par Vercel Inc., 440 Davis Court #205, San Francisco, CA 94111, États-Unis.',
      ],
    },
    {
      id: 'propriete-intellectuelle',
      title: '3. Propriété intellectuelle',
      paragraphs: [
        "L'ensemble des contenus présents sur le site Fiche Produit (textes, images, graphismes, logo, icônes, logiciels, etc.) sont la propriété exclusive de PRODEEF ou de ses partenaires, et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle.",
        'Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de PRODEEF.',
      ],
    },
    {
      id: 'responsabilite',
      title: '4. Limitation de responsabilité',
      paragraphs: [
        "PRODEEF ne pourra être tenue responsable des dommages directs ou indirects causés au matériel de l'utilisateur lors de l'accès au site, résultant soit de l'utilisation d'un matériel ne répondant pas aux spécifications indiquées, soit de l'apparition d'un bug ou d'une incompatibilité.",
        'PRODEEF se réserve le droit de supprimer, sans mise en demeure préalable, tout contenu déposé dans un espace interactif qui contreviendrait à la législation applicable en France.',
      ],
    },
  ],
};
