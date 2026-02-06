"use client";
import { motion } from "framer-motion";
import TickerItem from "./TickerItem";

function Ticker() {
  const UpperTicker = [
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/6985863f003423bf0c2d/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Let's Try",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698586c7001d64d79978/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Fraganote",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/6985871c0030e53b6e1a/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Rivona",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/69858852001204b15914/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Oceglow",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/69858885001215771e27/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Real Nutri Co",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698588c7001a9af429f9/view?project=698585dc0014c943f45e&mode=admin",
      alt: "He Oud Store",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698588d00008a31d3395/view?project=698585dc0014c943f45e&mode=admin",
      alt: "The Banboo Bay",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698588da0001826ba1bf/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Fresh Luxe",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698588e6000cf7711384/view?project=698585dc0014c943f45e&mode=admin",
      alt: "The Theater Project",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698588f0002f62669996/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Bon Fiction",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698588fc003263e97d6c/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Affasciu",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/6985890500316ed2573a/view?project=698585dc0014c943f45e&mode=admin",
      alt: "the Perfume Co.",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/69858915002750ef63f9/view?project=698585dc0014c943f45e&mode=admin",
      alt: "maa tee organic",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/6985891f0039fa4e25b2/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Wholy",
    },
  ];

  const lowerTicker = [
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/6985892b0030b085b15a/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Abono Rml",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698589380022d9602d51/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Smii Senses",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/6985894700175095f67c/view?project=698585dc0014c943f45e&mode=admin",
      alt: "HawtEver",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/69858950002a4b7996a0/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Chase Protein",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/6985895b00080bfcebb5/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Le Signor",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/69858969000ae79afaef/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Baroal",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/69858975002f670ebaf8/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Anuttama",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698589900034aba2386d/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Phab",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/6985899a001bb767d494/view?project=698585dc0014c943f45e&mode=admin",
      alt: "The Whole Truth",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698589a6003c3f20ee73/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Adil Quadri",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698589c6002506bacdf1/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Salt",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698589d30017492dcad3/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Seva",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/698589de002b1d5aeee2/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Assembly",
    },
    {
      src: "https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/69858a6d00164e8c28e7/view?project=698585dc0014c943f45e&mode=admin",
      alt: "Naso",
    },
  ];
  return (
    <div className="container mx-auto">
      <TickerItem images={UpperTicker} to="-100%" />
      <TickerItem images={lowerTicker} to="0%" />
    </div>
  );
}

export default Ticker;
