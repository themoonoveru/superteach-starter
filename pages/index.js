import toast, { Toaster } from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
    Connection,
    SystemProgram,
    Transaction,
    PublicKey,
    LAMPORTS_PER_SOL,
    clusterApiUrl,
    SendTransactionError,
} from "@solana/web3.js";
import { useSafe, useStorageUpload } from "@thirdweb-dev/react";

import axios from "axios";

const SOLANA_NETWORK = "devnet";

const Home = () => {
    const [isAuth, setAuth] = useState(false)
    const [publicKey, setPublicKey] = useState(null);
    const router = useRouter();
    const [balance, setBalance] = useState(0);
    const [Dist, setDist] = useState(0);
    const [receiver, setReceiver] = useState(null);
    const [amount, setAmount] = useState(null);
    const [explorerLink, setExplorerLink] = useState(null);

    const [uploadUrl, setUploadUrl] = useState(null);
    const [url, setUrl] = useState(null);
    const [statusText, setStatusText] = useState("");

    const [password, SetPassword] = useState("");

    const [AuthenticatedState, SetAuthenticatorState] = useState(null);


    useEffect(() => {
        let key = window.localStorage.getItem("publicKey"); //obtiene la publicKey del localStorage
        setPublicKey(key);
        if (key) getBalances(key);
        if (explorerLink) setExplorerLink(null);
    }, []);

    const logInfirebase = async () => {
        if (password.length <= 3 || password === undefined) {
            toast.error("Fallo: Contraseña demasiado corta 👻");
        } else {
            toast.success("Se ha ingresado con éxito 👻");
            setAuth(true);
        }
    };
    
    //funcion para registrar en firebase
    
    const signInfirebase = async (publicKey, password) => {
        if (password.length <= 3 || password == undefined) {
            toast.error("Fallo: Contraseña demaciado corta 👻");
        } else {
           
            toast.success("Tu cuenta para esta wallet se a creado con exito 👻");
        }
    };

    const handleReceiverChange = (event) => {
        setReceiver(event.target.value);
    };

    const HandlePasswordChange = (event) => {
        SetPassword(event.target.value);
    };

    const handleDist = (event) => {
        setDist(event.target.value);
        setAmount(multi);
        var multi = Dist*0.01;
        document.getElementById("rentaltext").innerHTML = "el costo del viaje sera de: $" + multi + " SOL";
        document.getElementById("bicx1").innerHTML = "1. autonomia: ~" + (30-Dist) + "km, cargando";
        document.getElementById("bicx2").innerHTML = "2. autonomia: ~" + (60-Dist) + "km";
        document.getElementById("bicx3").innerHTML = "3. autonomia: ~" + (10-Dist) + "km";
        document.getElementById("bicx4").innerHTML = "4. autonomia: ~" + (55-Dist) + "km, cargando";
        document.getElementById("bicx5").innerHTML = "5. autonomia: ~" + (20-Dist) + "km, cargando";
        document.getElementById("restante").innerHTML = "balance: $" + balance + " SOL";
        var receiver = "7tvXePCAxsHHokoqABbHPR6UH5QvohnWGkRj7zyq8VN3";
        var amount = multi;
    };

    const handleSubmit = async () => {
        console.log("Este es el receptor", receiver);
        console.log("Este es el monto", amount);
    };

    const handleUrlChange = (event) => {
        setUrl(event.target.value);
        console.log("Si se esta seteando la URL", url);
    };

    //Funcion para Iniciar sesion con nuestra Wallet de Phantom

    const signIn = async () => {
        //Si phantom no esta instalado
        const provider = window?.phantom?.solana;
        const { solana } = window;

        if (!provider?.isPhantom || !solana.isPhantom) {
            toast.error("Phantom no esta instalado");
            setTimeout(() => {
                window.open("https://phantom.app/", "_blank");
            }, 2000);
            return;
        }
        //Si phantom esta instalado
        let phantom;
        if (provider?.isPhantom) phantom = provider;

        const { publicKey } = await phantom.connect(); //conecta a phantom
        console.log("publicKey", publicKey.toString()); //muestra la publicKey
        setPublicKey(publicKey.toString()); //guarda la publicKey en el state
        window.localStorage.setItem("publicKey", publicKey.toString()); //guarda la publicKey en el localStorage

        toast.success("Tu Wallet esta conectada 👻");

        getBalances(publicKey);
    };

    //Funcion para cerrar sesion con nuestra Wallet de Phantom

    const signOut = async () => {
        if (window) {
            const { solana } = window;
            window.localStorage.removeItem("publicKey");
            setPublicKey(null);
            solana.disconnect();
            router.reload(window?.location?.pathname);
        }
    };

    //funcion para autenticar por firebase

    

    //Funcion para obtener el balance de nuestra wallet

    const getBalances = async (publicKey) => {
        try {
            const connection = new Connection(
                clusterApiUrl(SOLANA_NETWORK),
                "confirmed"
            );

            const balance = await connection.getBalance(
                new PublicKey(publicKey)
            );

            const balancenew = balance / LAMPORTS_PER_SOL;
            setBalance(balancenew);
        } catch (error) {
            console.error("ERROR GET BALANCE", error);
            toast.error("Something went wrong getting the balance");
        }
    };

    //Funcion para enviar una transaccion
    const sendTransaction = async () => {
        try {
            //Consultar el balance de la wallet
            getBalances(publicKey);
            console.log("Este es el balance", balance);

            //Si el balance es menor al monto a enviar
            if (balance < amount) {
                toast.error("No tienes suficiente balance");
                return;
            }

            const provider = window?.phantom?.solana;
            const connection = new Connection(
                clusterApiUrl(SOLANA_NETWORK),
                "confirmed"
            );

            //Llaves

            const fromPubkey = new PublicKey(publicKey);
            const toPubkey = new PublicKey(receiver);

            //Creamos la transaccion
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey,
                    toPubkey,
                    lamports: amount * LAMPORTS_PER_SOL,
                    
                })
                
            );
            console.log("Esta es la transaccion", transaction);

            //Traemos el ultimo blocke de hash
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = fromPubkey;

            //Firmamos la transaccion
            const transactionsignature = await provider.signTransaction(
                transaction
            );

            //Enviamos la transaccion
            const txid = await connection.sendRawTransaction(
                transactionsignature.serialize()
            );
            console.info(`Transaccion con numero de id ${txid} enviada`);

            //Esperamos a que se confirme la transaccion
            const confirmation = await connection.confirmTransaction(txid, {
                commitment: "singleGossip",
            });

            const { slot } = confirmation.value;

            console.info(
                `Transaccion con numero de id ${txid} confirmado en el bloque ${slot}`
            );

            const solanaExplorerLink = `https://explorer.solana.com/tx/${txid}?cluster=${SOLANA_NETWORK}`;
            setExplorerLink(solanaExplorerLink);

            toast.success("Transaccion enviada con exito :D ");

            //Actualizamos el balance
            getBalances(publicKey);
            setAmount(null);
            setReceiver(null);

            return solanaExplorerLink;
        } catch (error) {
            console.error("ERROR SEND TRANSACTION", error);
            toast.error("Error al enviar la transaccion");
        }
    };

    //Función para subir archivos a IPFS

    const { mutateAsync: upload } = useStorageUpload();

    const uploadToIpfs = async (file) => {
        setStatusText("Subiendo a IPFS...");
        const uploadUrl = await upload({
            data: [file],
            options: {
                uploadWithGatewayUrl: true,
                uploadWithoutDirectory: true,
            },
        });
        return uploadUrl[0];
    };

    // URL a Blob
    const urlToBLob = async (file) => {
        setStatusText("Transformando url...");
        await fetch(url)
            .then((res) => res.blob())
            .then((myBlob) => {
                // logs: Blob { size: 1024, type: "image/jpeg" }

                myBlob.name = "blob.png";

                file = new File([myBlob], "image.png", {
                    type: myBlob.type,
                });
            });

        const uploadUrl = await uploadToIpfs(file);
        console.log("uploadUrl", uploadUrl);

        setStatusText(`La url de tu archivo es: ${uploadUrl} `);
        setUploadUrl(uploadUrl);

        return uploadUrl;
    };

    //Funcion para crear un NFT
    const generateNFT = async () => {
        try {
            setStatusText("Creando tu NFT...❤");
            const mintedData = {
                name: "Mi primer NFT con Superteam MX",
                imageUrl: uploadUrl,
                publicKey,
            };
            console.log("Este es el objeto mintedData:", mintedData);
            setStatusText(
                "Minteando tu NFT en la blockchain Solana 🚀 Porfavor espera..."
            );
            const { data } = await axios.post("/api/mintnft", mintedData);
            const { signature: newSignature } = data;
            const solanaExplorerUrl = `https://solscan.io/tx/${newSignature}?cluster=${SOLANA_NETWORK}`;
            console.log("solanaExplorerUrl", solanaExplorerUrl);
            setStatusText(
                "¡Listo! Tu NFT se a creado, revisa tu Phantom Wallet 🖖"
            );
        } catch (error) {
            console.error("ERROR GENERATE NFT", error);
            toast.error("Error al generar el NFT");
        }
    };
    

    
    return (
        <>
            {
                !isAuth == true? (
                    <div className="h-screen bg-black">
                        <div className="flex flex-col  w-full h-auto  bg-black">
                            <div className="flex flex-col py-24 place-items-center justify-center">
                                <h1 className="text-5xl font-bold pb-10 text-purple-300">
                                    bicx 🦍
                                </h1>

                                {publicKey ? (
                                    <div className="flex flex-col py-24 place-items-center justify-center">
                                        <br />
                                        <h1 className="text-2xl font-bold text-white"> Tu numero de Wallet es </h1>

                                        <input type="text" className="h-8 w-80 mt-4   border-2 border-black " value={publicKey} />

                                        <h1 className="text-2xl font-bold text-white"> Porfavor inserte su contraseña </h1>

                                        <input type="text" className="h-8 w-80 mt-4   border-2 border-black " onChange={HandlePasswordChange} />
                                        <br />

                                        <button
                                            type="submit"
                                            className="inline-flex h-8 w-52 justify-center bg-purple-500 font-bold text-white"
                                            onClick={() => {
                                                logInfirebase();
                                            }}
                                        >
                                            Iniciar sesion
                                        </button>

                                        

                                        <button
                                            type="submit"
                                            className="inline-flex h-8 w-52 justify-center bg-gray-500 font-bold text-white"
                                            onClick={() => {
                                                signInfirebase(publicKey, password);
                                            }}
                                        >
                                            Registrar
                                        </button>

                                        <button
                                            type="submit"
                                            className="inline-flex h-8 w-52 justify-center bg-gray-500 font-bold text-white"
                                            onClick={() => {
                                                signOut();
                                            }}
                                        >
                                            Desconecta tu wallet 👻
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col place-items-center justify-center">
                                        <button
                                            type="submit"
                                            className="inline-flex h-8 w-52 justify-center bg-purple-500 font-bold text-white"
                                            onClick={() => {
                                                signIn();
                                            }}
                                        >
                                            Conecta tu wallet 👻
                                        </button>
                                    </div>

                                )}
                            </div>
                            <Toaster position="bottom-center" />
                        </div>
                    </div>
                ) : (
                    <div className="h-screen bg-black">
                        <div className="flex flex-col  w-full h-auto  bg-black">
                            <div className="flex flex-col py-24 place-items-center justify-center">
                                <h1 className="text-5xl font-bold pb-10 text-purple-300">
                                    bicx disponibles
                                </h1>
                                        <img src="https://i.imgur.com/wSpXWVU.png"></img>
                                    <div className="flex flex-col py-4 place-items-center justify-center">
                                        <br />

                                        <h1 className="text-2xl font-bold text-white"> Porfavor elija su vehiculo 🍃 </h1>
                                        
                                        <h2 className=" text-white"> la distancia hasta su casa del tec es de </h2>

                                        <input type="text" className="h-8 w-80 mt-4   border-2 border-black " onChange={handleDist}/>

                                        <ul className="text-xl text-white font-italic pb-10 py-10">
                                        <li>Estacion, disponibles:</li>
                                        <li id="bicx1">1. autonomia: ~30km, cargando</li>
                                        <li id="bicx2">2. autonomia: ~60km</li>
                                        <li id="bicx3">3. autonomia: ~10km</li>
                                        <li id="bicx4">4. autonomia: ~55km, cargando</li>
                                        <li id="bicx5">5. autonomia: ~20km, cargando</li>
                                        </ul>

                                        <button
                                            type="submit"
                                            className="inline-flex h-8 w-52 justify-center bg-purple-500 font-bold text-white"
                                            onClick={() => {
                                                sendTransaction();
                                            }}
                                        >
                                            Rentar
                                        </button>

                                        <h2 className=" text-white" id="rentaltext"> el precio de el viaje seria de: </h2>

                                        <button
                                            type="submit"
                                            className="inline-flex h-8 w-52 justify-center bg-gray-500 font-bold text-white"
                                            onClick={() => {
                                                signOut();
                                            }}
                                        >
                                            Desconecta tu wallet 👻
                                        </button>
                                        
                                        <h2 className=" text-white" id="restante"> balance:  </h2>
                                    </div>
                            </div>
                        </div>
                    </div>
                    
                )
            }
        </>
    );
};

export default Home;
