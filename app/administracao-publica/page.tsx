import ExamNotebook from "../components/ExamNotebook";
import {cards,makeConfig,questions} from "../administracao-data";
const ids=new Set(["52","53","54","55","58","59","60"]);
const config=makeConfig("20C","Gestão pública","conformidade e controle","Licitações, ética, orçamento e ferramentas digitais com foco em competência, fase, exceção e literalidade normativa.","adminPublic","Orçamento, contratos, conformidade, controles internos, ética, informação gerencial e atendimento aos órgãos de controle.");
export default function Page(){return <ExamNotebook config={config} questions={questions.filter(q=>ids.has(q.examId))} cards={cards.filter(c=>["Orçamento","Licitações","Ética","Excel","Linguagem"].includes(c.tag))}/>}
