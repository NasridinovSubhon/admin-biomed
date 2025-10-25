import { useEffect } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminDataStore } from '@/app/zustand';

const Categori = () => {
  const { getDataCategory, dataCateg } = adminDataStore();

  useEffect(() => {
    getDataCategory();
  }, [getDataCategory]);

  
  const getCorrectedServiceName = (serviceName) => {
    if (serviceName === "УЗИ-диагностикаa") {
      return "УЗИ-диагностика";
    }
    return serviceName;
  };

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Хизматрасониҳои мо</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Мо хизматрасониҳои тиббии пурсифатро бо истеъмоли навтарин технологияҳо пешниҳод мекунем
          </p>
        </div>

        {dataCateg.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex flex-col items-center justify-center">
              <svg className="w-16 h-16 text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-lg text-muted-foreground">Хизматрасониҳо дастрас нестанд</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataCateg.map((category) => (
              <Card
                key={category.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={category.img}
                    alt={getCorrectedServiceName(category.sohaiKlinik)}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                    {getCorrectedServiceName(category.sohaiKlinik)}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {category.descKlinik}
                  </CardDescription>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      ID: #{category.id}
                    </span>

                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* iOS оптимизация */}
        <style jsx>{`
          @media (max-width: 768px) {
            .grid {
              -webkit-overflow-scrolling: touch;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Categori;
