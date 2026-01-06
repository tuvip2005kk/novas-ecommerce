-- AlterTable
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" 
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
