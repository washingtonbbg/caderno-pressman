import ExamNotebook from "../components/ExamNotebook";
import AdminNotebookBank from "../components/AdminNotebookBank";
import "../complete-bank.css";
import "../admin-notebook-bank.css";
import {cards,makeConfig,questions} from "../administracao-data";
const ids=new Set(["41","42","43","44","45","51"]);
const config=makeConfig("20A","Administração","estratégia e decisão","Planejamento, liderança, ambiente, teorias e análise de investimentos com leitura do vocabulário que denuncia distratores.","adminStrategy","Planejar, organizar, coordenar, controlar, elaborar indicadores e subsidiar decisões institucionais.");
export default function Page(){return <ExamNotebook config={config} questions={questions.filter(q=>ids.has(q.examId))} cards={cards.filter(c=>["Planejamento","Organização","Finanças","Linguagem"].includes(c.tag))} supplement={<AdminNotebookBank notebook="/administracao-gestao"/>}/>}
