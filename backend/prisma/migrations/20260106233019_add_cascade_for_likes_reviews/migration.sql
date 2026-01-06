-- AlterTable Like - Add CASCADE delete
ALTER TABLE "Like" DROP CONSTRAINT "Like_productId_fkey";

ALTER TABLE "Like" ADD CONSTRAINT "Like_productId_fkey" 
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable Review - Add CASCADE delete  
ALTER TABLE "Review" DROP CONSTRAINT "Review_productId_fkey";

ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" 
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
