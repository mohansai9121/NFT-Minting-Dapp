'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { contractABI } from './contractABI';
import Image from 'next/image';

const NFTMintingPage = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [tx, setTx] = useState<ethers.ContractTransaction | null>(null);
  const [nfts, setNfts] = useState<{ tokenId: string; imageUrl: string }[]>([]);

  useEffect(() => {
    const init = async () => {
      const detectedProvider = await detectEthereumProvider();
      if (detectedProvider) {
        const ethersProvider = new ethers.providers.Web3Provider(detectedProvider as any);
        setProvider(ethersProvider);
      }
    };
    init();
  }, []);

  const connectWallet = async () => {
    if (provider) {
      try {
        await provider.send('eth_requestAccounts', []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        await fetchNFTs(address);
        console.log(address);
        console.log(nfts);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };

  const mintNFT = async () => {
    if (!provider || !account) return;

    const contractAddress = '0x68C1676e9D9147677DB265ce61e9E876e652497A';

    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.safeMint('0xe701A4a0F8C18f76B3F0f4D8555Bdd3290f0f9DB', "695.json");
      await tx.wait();
      console.log('NFT minted successfully!');
      console.log(tx);
      setTx(tx);
      fetchNFTs(account);
    } catch (error) {
      console.error('Failed to mint NFT:', error);
    }
  };

  const fetchNFTs = async (address: string) => {
    if (!provider) return;

    const contractAddress = '0x68C1676e9D9147677DB265ce61e9E876e652497A';
    const contract = new ethers.Contract(contractAddress, contractABI, provider);

    try {
      const balance = parseInt(await contract.balanceOf(address));
      console.log(balance);
      const tokenIds: number[] = [];

      for (let i = 1; i < balance; i++) {
        console.log(await contract.ownerOf(i));
        if(await contract.ownerOf(i) === address){
          console.log(i);
          tokenIds.push(i);
        }
      }
      console.log(tokenIds);
      // const tokenIds = await Promise.all(nftPromises);
      const nftMetadataPromises = tokenIds.map(id => contract.tokenURI(id));
      const metadataUrls = await Promise.all(nftMetadataPromises);
      console.log(metadataUrls);

      const nftData = await Promise.all(
        metadataUrls.map(async (url, index) => {
          const response = await fetch(url);
          const metadata = await response.json();
          console.log(metadata);
          return {
            tokenId: tokenIds[index].toString(),
            imageUrl: metadata.image_url,
            placeholderUrl: '/placeholder.png',
          };
        })
        // console.log(metadataUrls)
      );

      setNfts(nftData);
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    }
  };

  return (
    <div className=" bg-black min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-8 text-black">NFT Minting on Polygon</h1>
      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="text-center text-black">
          <p className="mb-4">Connected: {account}</p>
          <button
            onClick={mintNFT}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mb-4"
          >
            Mint NFT
          </button>
          {tx && <p className="mb-4">Transaction: {tx.hash}</p>}
          <p className='text-black'>Total NFTs: {nfts.length}</p>
          <div className="bg-black grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            
            {nfts.map((nft) => (
              <div key={nft.tokenId} className="border p-4 rounded">
                {/* {nft.imageUrl ? <Image src={nft.imageUrl} alt={`NFT ${nft.tokenId}`} width={200} height={200} /> : <p>No image</p>} */}
                <Image src={nft.imageUrl || '/placeholder.png'} alt={`NFT ${nft.tokenId}`} width={200} height={200} />
                <p className="mt-2 text-white">Token ID: {nft.tokenId}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTMintingPage;