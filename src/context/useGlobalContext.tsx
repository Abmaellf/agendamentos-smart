import { getAuthorizationToken, setAuthorizationToken } from "@/api/auth";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface GlobalData {
  token?: string;
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

  useEffect(()=>{
    const token = getAuthorizationToken()
    if(token) {
      setAccessToken(token)
    }
  },[])

  const setAccessToken = (token: string) => {

    setAuthorizationToken(token);

    setGlobalData({
      ...globalData,
      token,
    });
    
  };

  return {
    token: globalData.token,
    setAccessToken,
  }
}
