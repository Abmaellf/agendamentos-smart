import { createContext, ReactNode, useContext, useState } from "react";

interface GlobalData {
  accessToken?: string;
}

interface GlobalContextType {
  globalData: GlobalData
  setGlobalData: (globalData: GlobalData) => void;
}

const GlobalContext = createContext({} as GlobalContextType)

interface GlobalContextProviderType {
    children: ReactNode
}

export function GlobalContextProvider({ children }: GlobalContextProviderType) {

const [globalData, setGlobalData] = useState<GlobalData>({})


return(
    <GlobalContext.Provider value={{
        globalData,
        setGlobalData
    }}>
        {children}
    </GlobalContext.Provider>
)
}


export const useGlobalContext = () => {
  
  const { globalData , setGlobalData } = useContext(GlobalContext);

const setAccessToken = (accessToken: string) => {
  setGlobalData({
    ...globalData,
    accessToken,
  });
};

  return {
    accessToken: globalData.accessToken,
    setAccessToken,
  }
}
