"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Lang = "en" | "fr";

// ---------------------------------------------------------------------------
// All UI strings
// ---------------------------------------------------------------------------
const UI: Record<string, Record<Lang, string>> = {
  // Nav / global
  launchApp:        { en: "Launch app",          fr: "Lancer l'app" },
  noDataStored:     { en: "No data stored. Ever.", fr: "Aucune donnée stockée." },
  madeBy:           { en: "Made by",              fr: "Créé par" },
  mitLicense:       { en: "MIT License",          fr: "Licence MIT" },
  viewOnGithub:     { en: "View on GitHub",       fr: "Voir sur GitHub" },
  bySkander:        { en: "by Skander",            fr: "par Skander" },

  // Landing
  heroLabel:        { en: "AI-powered CV tailoring",  fr: "Personnalisation de CV par IA" },
  heroTitle1:       { en: "Your CV,",                 fr: "Votre CV," },
  heroTitle2:       { en: "tailored",                 fr: "personnalisé" },
  heroTitle3:       { en: "in seconds.",              fr: "en quelques secondes." },
  heroSub:          { en: "Upload your LinkedIn profile, paste a job description — get a clean, ATS-ready CV that speaks directly to the role.",
                      fr: "Importez votre profil LinkedIn, collez une offre d'emploi — obtenez un CV propre et optimisé ATS, adapté au poste." },
  buildMyCv:        { en: "Build my CV",              fr: "Créer mon CV" },
  howItWorks:       { en: "How it works",             fr: "Comment ça marche" },
  step1Title:       { en: "Upload your profile",      fr: "Importez votre profil" },
  step1Body:        { en: "Export your LinkedIn profile as a PDF, or paste your CV text directly.", fr: "Exportez votre profil LinkedIn en PDF, ou collez votre texte directement." },
  step2Title:       { en: "Paste the job description", fr: "Collez l'offre d'emploi" },
  step2Body:        { en: "Drop in the full job posting. Our AI reads every requirement.", fr: "Collez l'offre complète. Notre IA analyse chaque exigence." },
  step3Title:       { en: "Download your CV",         fr: "Téléchargez votre CV" },
  step3Body:        { en: "Get a formatted, ATS-clean .docx file tailored to that exact role.", fr: "Obtenez un fichier .docx formaté et optimisé ATS, adapté au poste." },
  readyToApply:     { en: "Ready to apply?",          fr: "Prêt à postuler ?" },
  getStarted:       { en: "Get started — it's free",  fr: "Commencer — c'est gratuit" },

  // Step labels
  stepProfile:      { en: "Profile",    fr: "Profil" },
  stepJob:          { en: "Job",        fr: "Poste" },
  stepReview:       { en: "Review",     fr: "Révision" },
  stepTemplate:     { en: "Template",   fr: "Modèle" },
  stepGenerate:     { en: "Generate",   fr: "Générer" },

  // StepProfile
  yourProfile:      { en: "Your profile",   fr: "Votre profil" },
  profileSub:       { en: "Upload your LinkedIn PDF export or paste your CV text.", fr: "Importez votre PDF LinkedIn ou collez votre texte." },
  uploadPdf:        { en: "Upload PDF",     fr: "Importer PDF" },
  pasteText:        { en: "Paste text",     fr: "Coller le texte" },
  dragDrop:         { en: "Drag and drop your PDF here", fr: "Glissez-déposez votre PDF ici" },
  orClick:          { en: "or click to browse — max 5MB", fr: "ou cliquez pour parcourir — max 5 Mo" },
  pastePlaceholder: { en: "Paste your CV or LinkedIn profile text here...", fr: "Collez votre CV ou profil LinkedIn ici..." },
  errorPdf:         { en: "Only PDF files are accepted.", fr: "Seuls les fichiers PDF sont acceptés." },
  errorSize:        { en: "File must be under 5MB.", fr: "Le fichier doit faire moins de 5 Mo." },
  errorUpload:      { en: "Please upload your LinkedIn PDF.", fr: "Veuillez importer votre PDF LinkedIn." },
  errorPaste:       { en: "Please paste at least 50 characters of your profile.", fr: "Veuillez coller au moins 50 caractères de votre profil." },
  continue:         { en: "Continue",   fr: "Continuer" },
  back:             { en: "← Back",     fr: "← Retour" },

  // StepJob
  theRole:          { en: "The role",   fr: "Le poste" },
  roleSub:          { en: "Paste the full job description. The more detail, the better the tailoring.", fr: "Collez l'offre complète. Plus c'est détaillé, meilleur sera le résultat." },
  jobPlaceholder:   { en: "Paste the full job description here...", fr: "Collez l'offre d'emploi complète ici..." },
  errorJob:         { en: "Please paste a job description of at least 50 characters.", fr: "Veuillez coller une offre d'au moins 50 caractères." },

  // StepReview
  reviewTitle:      { en: "Review your CV",   fr: "Vérifiez votre CV" },
  reviewing:        { en: "Review your CV",   fr: "Vérifiez votre CV" },
  reviewSub:        { en: "Check everything looks right. Edit any field before generating.", fr: "Vérifiez que tout est correct. Modifiez avant de générer." },
  dragHint:         { en: "Drag sections to reorder", fr: "Glissez les sections pour les réorganiser" },
  analysing:        { en: "Analysing your profile…",  fr: "Analyse de votre profil…" },
  analysingMsg:     { en: "Reading your CV and job description…", fr: "Lecture de votre CV et de l'offre…" },
  analysingTime:    { en: "Extracting your experience. Takes about 15 seconds.", fr: "Extraction de votre expérience. Environ 15 secondes." },
  errorTitle:       { en: "Something went wrong",     fr: "Une erreur est survenue" },
  extractFailed:    { en: "Extraction failed",        fr: "Échec de l'extraction" },
  looksGood:        { en: "Looks good — choose template", fr: "C'est bon — choisir le modèle" },
  sectionDisabled:  { en: "Section disabled. Toggle on to include in your CV.", fr: "Section désactivée. Activez-la pour l'inclure dans votre CV." },
  startOver:        { en: "Start over",          fr: "Recommencer" },
  roleN:            { en: "Role",                fr: "Poste" },
  enableSection:    { en: "Enable section",      fr: "Activer la section" },

  // Section names
  basics:           { en: "Basics",          fr: "Informations générales" },
  contact:          { en: "Contact",          fr: "Contact" },
  experience:       { en: "Experience",       fr: "Expérience" },
  education:        { en: "Education",        fr: "Formation" },
  skills:           { en: "Skills",           fr: "Compétences" },
  certifications:   { en: "Certifications",   fr: "Certifications" },
  languages:        { en: "Languages",        fr: "Langues" },
  projects:         { en: "Projects",         fr: "Projets" },
  keywords:         { en: "Job Keywords",     fr: "Mots-clés du poste" },

  // Field labels
  fullName:         { en: "Full name",        fr: "Nom complet" },
  profTitle:        { en: "Professional title", fr: "Titre professionnel" },
  summary:          { en: "Summary",          fr: "Résumé" },
  email:            { en: "Email",            fr: "Email" },
  phone:            { en: "Phone",            fr: "Téléphone" },
  location:         { en: "Location",         fr: "Localisation" },
  company:          { en: "Company",          fr: "Entreprise" },
  title:            { en: "Title",            fr: "Titre" },
  start:            { en: "Start",            fr: "Début" },
  end:              { en: "End",              fr: "Fin" },
  bullets:          { en: "Bullets",          fr: "Points" },
  institution:      { en: "Institution",      fr: "Établissement" },
  degree:           { en: "Degree",           fr: "Diplôme" },
  field:            { en: "Field of study",   fr: "Domaine d'études" },
  year:             { en: "Year",             fr: "Année" },
  issuer:           { en: "Issuer",           fr: "Organisme" },
  language:         { en: "Language",         fr: "Langue" },
  level:            { en: "Level",            fr: "Niveau" },
  projName:         { en: "Project name",     fr: "Nom du projet" },
  projDesc:         { en: "Description",      fr: "Description" },
  role:             { en: "Role",             fr: "Poste" },

  // Actions
  remove:           { en: "Remove",           fr: "Supprimer" },
  addBullet:        { en: "Add bullet",       fr: "Ajouter un point" },
  addExperience:    { en: "Add experience",   fr: "Ajouter une expérience" },
  addEducation:     { en: "Add education",    fr: "Ajouter une formation" },
  addCert:          { en: "Add certification", fr: "Ajouter une certification" },
  addLanguage:      { en: "Add language",     fr: "Ajouter une langue" },
  addProject:       { en: "Add project",      fr: "Ajouter un projet" },
  addSkill:         { en: "Add skill",        fr: "Ajouter une compétence" },
  add:              { en: "Add",              fr: "Ajouter" },
  technical:        { en: "Technical",        fr: "Technique" },
  soft:             { en: "Soft skills",      fr: "Savoir-être" },
  industry:         { en: "Industry",         fr: "Secteur" },
  keywordsSub:      { en: "Keywords extracted from the job description. The AI uses these when tailoring.", fr: "Mots-clés extraits de l'offre. L'IA les utilise pour adapter votre CV." },

  // StepTemplate
  chooseTemplate:   { en: "Choose a template",  fr: "Choisir un modèle" },
  templateSub:      { en: "All templates are ATS-clean and formatted for hiring systems.", fr: "Tous les modèles sont optimisés ATS." },
  classic:          { en: "Classic",            fr: "Classique" },
  classicDesc:      { en: "Clean, structured, ATS-optimised.", fr: "Propre, structuré, optimisé ATS." },
  modern:           { en: "Modern",             fr: "Moderne" },
  modernDesc:       { en: "Bold navy header, accent rules.", fr: "En-tête marine, règles d'accent." },
  compact:          { en: "Compact",            fr: "Compact" },
  compactDesc:      { en: "Maximum content, minimal space.", fr: "Contenu maximum, espace minimal." },

  // StepDownload
  generateTitle:    { en: "Generate your CV",   fr: "Générer votre CV" },
  generateSub:      { en: "One final AI pass to tailor your CV to the job. Takes about 10 seconds.", fr: "Une dernière passe IA pour adapter votre CV au poste. Environ 10 secondes." },
  generateBtn:      { en: "Generate CV",        fr: "Générer le CV" },
  tailoring:        { en: "Tailoring your CV to the job…", fr: "Adaptation de votre CV au poste…" },
  downloadDocx:     { en: "Download .docx",     fr: "Télécharger .docx" },
  editBtn:          { en: "Edit CV",             fr: "Modifier le CV" },
  generationFailed: { en: "Generation failed",  fr: "Échec de la génération" },
  tryAgain:         { en: "Try again",          fr: "Réessayer" },
};

export function u(key: string, lang: Lang): string {
  return UI[key]?.[lang] ?? UI[key]?.["en"] ?? key;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  u: (key: string) => string;
}

const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  u: (k) => k,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const translate = useCallback((key: string) => u(key, lang), [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, u: translate }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

// ---------------------------------------------------------------------------
// Job description language detector
// ---------------------------------------------------------------------------
const FR_WORDS = ["le ", "la ", "les ", "de ", "du ", "des ", "et ", "en ", "pour ",
  "avec ", "dans ", "sur ", "une ", "est ", "sont ", "par ", "au ", "aux ",
  "nous ", "vous ", "poste ", "emploi ", "entreprise ", "équipe ", "expérience "];

export function detectJobLang(text: string): Lang {
  const lower = text.toLowerCase();
  const hits = FR_WORDS.filter(w => lower.includes(w)).length;
  return hits >= 4 ? "fr" : "en";
}