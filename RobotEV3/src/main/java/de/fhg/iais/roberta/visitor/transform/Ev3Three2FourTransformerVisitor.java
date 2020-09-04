package de.fhg.iais.roberta.visitor.transform;

import de.fhg.iais.roberta.factory.BlocklyDropdownFactory;

public class Ev3Three2FourTransformerVisitor implements IEv3TransformerVisitor<Void> {

    private final BlocklyDropdownFactory blocklyDropdownFactory;

    public Ev3Three2FourTransformerVisitor(BlocklyDropdownFactory blocklyDropdownFactory) {
        this.blocklyDropdownFactory = blocklyDropdownFactory;
    }

    @Override
    public BlocklyDropdownFactory getBlocklyDropdownFactory() {
        return this.blocklyDropdownFactory;
    }
}
