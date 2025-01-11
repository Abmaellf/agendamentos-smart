import { Header } from "./component/Header";
import { Sidebar } from "./component/Sidebar";

export function App() {

  return(
    <>
     <Header/>
     <main>
      <section>
        <Sidebar />
      </section>
     </main>
    </>
  )
}
