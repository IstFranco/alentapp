-- CreateTable
CREATE TABLE "sports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "max_capacity" INTEGER NOT NULL,
    "additional_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "requires_medical_certificate" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sports_name_key" ON "sports"("name");
