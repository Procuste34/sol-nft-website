import { WalletAdapterNetwork, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@solana/wallet-adapter-react-ui/lib/types/Button';

import { createMint, createMintToInstruction, getOrCreateAssociatedTokenAccount, mintTo, setAuthority, transfer, createTransferInstruction, TOKEN_PROGRAM_ID, MINT_SIZE, createInitializeMintInstruction, createAssociatedTokenAccount, createAssociatedTokenAccountInstruction, getMinimumBalanceForRentExemptAccount, getMinimumBalanceForRentExemptMint } from  "@solana/spl-token";

import '../src/css/bootstrap.css'
import {
    GlowWalletAdapter,
    LedgerWalletAdapter,
    PhantomWalletAdapter,
    SlopeWalletAdapter,
    SolflareWalletAdapter,
    SolletExtensionWalletAdapter,
    SolletWalletAdapter,
    TorusWalletAdapter,

} from '@solana/wallet-adapter-wallets';
import fs from "fs";

import { clusterApiUrl, Transaction, SystemProgram, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmRawTransaction, sendAndConfirmTransaction } from '@solana/web3.js';
import React, { FC, ReactNode, useMemo, useCallback, useState } from 'react';
import { create } from 'domain';
import { sign } from 'crypto';

//import { actions, utils, programs, NodeWallet, Connection} from '@metaplex/js'; 

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID: PublicKey = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

require('./App.css');
require('@solana/wallet-adapter-react-ui/styles.css');

const App: FC = () => {
    return (
        <Context>
            <Content />
        </Context>
    );
};

var sendToAddress = "";


export default App;

const Context: FC<{ children: ReactNode }> = ({ children }) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint.
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
    // Only the wallets you configure here will be compiled into your application, and only the dependencies
    // of wallets that your users connect to will be loaded.
    const wallets = useMemo(
        () => [
            new LedgerWalletAdapter(),
            new PhantomWalletAdapter(),
            new GlowWalletAdapter(),
            new SlopeWalletAdapter(),
            new SolletExtensionWalletAdapter(), 
            new SolletWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new TorusWalletAdapter(),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

const Content: FC = () => {
    let [lamports, setLamports] = useState(.1);

    

    const { connection } = useConnection();
    const { publicKey, signTransaction, sendTransaction } = useWallet(); 

    const onClickSend = useCallback( async () => {

        // on recupere puis print la balance en SOL du wallet
        if (!publicKey) throw new WalletNotConnectedError();
        connection.getBalance(publicKey).then((bal) => {
            console.log(bal/LAMPORTS_PER_SOL);

        });

        let lamportsI = LAMPORTS_PER_SOL*1;
        console.log(publicKey.toBase58());        

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: Keypair.generate().publicKey,
                lamports: lamportsI,
            })
        );

        const signature = await sendTransaction(transaction, connection);

        await connection.confirmTransaction(signature, 'processed');
    }, [publicKey, sendTransaction, connection]);

    const onClickCreate = useCallback( async () => {

        if (!publicKey) throw new WalletNotConnectedError();

        const lamports = await getMinimumBalanceForRentExemptMint(connection) //on pourra withdraw ????? TODOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
        const mint = Keypair.generate()

        console.log("send to address:" + sendToAddress);

        const toPublicKey = new PublicKey(sendToAddress);
        
        //7C5DY4dsDWfJsFuasBBPYLkp2j8Du12cjE5sFGQbXnS9

        const transaction = new Transaction({ feePayer: publicKey, recentBlockhash: (await connection.getLatestBlockhash()).blockhash });

        transaction.add(
            SystemProgram.createAccount({
                fromPubkey: publicKey,
                newAccountPubkey: mint.publicKey,
                space: MINT_SIZE,
                lamports,
                programId: TOKEN_PROGRAM_ID
            }),
            createInitializeMintInstruction(mint.publicKey, 0, publicKey, null, TOKEN_PROGRAM_ID)
        )

        const userTokenAccountAddress = (
            await PublicKey.findProgramAddress(
                [toPublicKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.publicKey.toBuffer()],
                SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
            )
        )[0]

        transaction.add(
            createAssociatedTokenAccountInstruction(publicKey, userTokenAccountAddress, toPublicKey, mint.publicKey),
            createMintToInstruction(mint.publicKey, userTokenAccountAddress, publicKey, 69, [], TOKEN_PROGRAM_ID)
        )

        transaction.sign(mint)

        const txID = await sendTransaction(transaction, connection)

        console.log(mint.publicKey.toBase58())
        console.log(userTokenAccountAddress.toBase58())
        
    }, [publicKey, sendTransaction, connection]);

    function updateSendToAddress(ine: any)
    { 
        sendToAddress = ine.target.value;
        console.log(sendToAddress);
    }

    return (
        <div className="App">
                <div className="navbar">
        <div className="navbar-inner ">
          <a id="title" className="brand" href="#">[Site pour auteur] Créer et mint NFT sur l'address renseignée</a>
          <ul className="nav">
          </ul>
          <ul className="nav pull-right">
                      <li><a href="#">White Paper</a></li>
                      <li className="divider-vertical"></li>
                      <li><WalletMultiButton /></li>
                    </ul>
        </div>
        </div>
        <label>7C5DY4dsDWfJsFuasBBPYLkp2j8Du12cjE5sFGQbXnS9</label>
        <input type="string" onChange={(ine) => updateSendToAddress(ine)}></input>
        <br></br>
        
        <button className='btn' onClick={onClickCreate}>Creet + Mint NFT</button>

        </div>
    );
};

//<button className='btn' onClick={onClickSend}>Envoi moi 1 SOL</button>
