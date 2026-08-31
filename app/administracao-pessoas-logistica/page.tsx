import ExamNotebook from "../components/ExamNotebook";
import {cards,makeConfig,questions} from "../administracao-data";
const ids=new Set(["46","47","48","49","50"]);
const config=makeConfig("20B","Pessoas, materiais","e processos","Logística, estoques, desenho de cargos, avaliação e desenvolvimento com distinções vocabulares de alta incidência.","adminPeople","Gestão de pessoas, patrimônio, materiais, estoques, logística, fluxos, rotinas e melhoria de processos.");
export default function Page(){return <ExamNotebook config={config} questions={questions.filter(q=>ids.has(q.examId))} cards={cards.filter(c=>["Logística","Materiais","Pessoas","Linguagem"].includes(c.tag))}/>}
